import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

// GET all customers + sub-admins
export async function GET(request) {
    try {
        await connectDB();

        const currentUser = await getAuthUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json(
                { message: 'Admin access required' },
                { status: 403 }
            );
        }

        // get all users except admins
        // const users = await User.find({ role: { $ne: 'admin' } })
        //     .select('-password')
        //     .sort({ createdAt: -1 });

        // return NextResponse.json({ users }, { status: 200 });
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();

        const filter = { role: { $ne: 'admin' } };
        if (search) {
            filter.$or = [
                { phone: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

        // Aggregate total time + top-viewed products per user in one pass
        const Activity = (await import('@/models/Activity')).default;
        const userIds = users.map((u) => u._id);

        const timeStats = await Activity.aggregate([
            { $match: { user: { $in: userIds }, type: 'heartbeat' } },
            { $group: { _id: '$user', totalSeconds: { $sum: '$durationSeconds' } } },
        ]);
        const timeMap = Object.fromEntries(timeStats.map((t) => [t._id.toString(), t.totalSeconds]));

        const topProducts = await Activity.aggregate([
            { $match: { user: { $in: userIds }, type: 'product_view' } },
            { $group: { _id: { user: '$user', product: '$product' }, views: { $sum: 1 }, lastViewedAt: { $max: '$createdAt' } } },
            { $sort: { views: -1 } },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id.product',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            {
                $group: {
                    _id: '$_id.user',
                    products: {
                        $push: {
                            name: { $arrayElemAt: ['$productInfo.name', 0] },
                            views: '$views',
                            lastViewedAt: '$lastViewedAt',
                        },
                    },
                },
            },
        ]);
        const productMap = Object.fromEntries(topProducts.map((p) => [p._id.toString(), p.products.slice(0, 3)]));

        const usersWithStats = users.map((u) => ({
            ...u.toObject(),
            totalTimeSeconds: timeMap[u._id.toString()] || 0,
            topProducts: productMap[u._id.toString()] || [],
        }));

        return NextResponse.json({ users: usersWithStats }, { status: 200 });
    } catch (error) {
        console.error('Team GET error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH promote or demote user
export async function PATCH(request) {
    try {
        await connectDB();

        const currentUser = await getAuthUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json(
                { message: 'Admin access required' },
                { status: 403 }
            );
        }

        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json(
                { message: 'userId and role are required' },
                { status: 400 }
            );
        }

        // only allow setting customer or sub-admin
        if (!['customer', 'sub-admin'].includes(role)) {
            return NextResponse.json(
                { message: 'Invalid role' },
                { status: 400 }
            );
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: `User role updated to ${role}`, user },
            { status: 200 }
        );
    } catch (error) {
        console.error('Team PATCH error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}