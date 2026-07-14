import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    try {
        await connectDB();

        const currentUser = await getAuthUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }

        // Most-viewed products among guests (no account) only
        const topGuestProducts = await Activity.aggregate([
            { $match: { user: null, type: 'product_view' } },
            { $group: { _id: '$product', views: { $sum: 1 }, lastViewedAt: { $max: '$createdAt' }, lastProductName: { $last: '$productName' } } },
            { $sort: { views: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            {
                $project: {
                    views: 1,
                    lastViewedAt: 1,
                    name: { $ifNull: [{ $arrayElemAt: ['$productInfo.name', 0] }, '$lastProductName'] },
                },
            },
        ]);

        // Distinct guest visitors + how many pages/products they've touched
        const guestVisitors = await Activity.aggregate([
            { $match: { user: null } },
            {
                $group: {
                    _id: '$visitorId',
                    totalEvents: { $sum: 1 },
                    productViews: {
                        $sum: { $cond: [{ $eq: ['$type', 'product_view'] }, 1, 0] },
                    },
                    lastSeen: { $max: '$createdAt' },
                },
            },
            { $sort: { lastSeen: -1 } },
            { $limit: 50 },
        ]);

        return NextResponse.json({ topGuestProducts, guestVisitors }, { status: 200 });
    } catch (error) {
        console.error('Analytics GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}