import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { pushNotification } from '@/lib/notify';

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }
        await connectDB();
        const coupons = await Coupon.find()
            .populate('targetProduct', 'name')
            .populate('usedInOrder', 'orderNumber')
            .sort({ createdAt: -1 });
        return NextResponse.json({ coupons }, { status: 200 });
    } catch (error) {
        console.error('Coupons GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }
        await connectDB();

        const { code, targetPhone, targetEmail, scope, targetProduct, targetCategory, discountPercent, expiresAt } =
            await request.json();

        if (!code || !scope || !discountPercent) {
            return NextResponse.json({ message: 'Code, scope, and discount are required' }, { status: 400 });
        }
        if (!targetPhone && !targetEmail) {
            return NextResponse.json({ message: 'A target phone or email is required' }, { status: 400 });
        }
        if (scope === 'product' && !targetProduct) {
            return NextResponse.json({ message: 'Select a product for product-scoped coupons' }, { status: 400 });
        }
        if (scope === 'category' && !targetCategory) {
            return NextResponse.json({ message: 'Select a category for category-scoped coupons' }, { status: 400 });
        }

        const coupon = await Coupon.create({
            code: code.trim().toUpperCase(),
            targetPhone: targetPhone?.trim() || null,
            targetEmail: targetEmail?.trim().toLowerCase() || null,
            scope,
            targetProduct: scope === 'product' ? targetProduct : null,
            targetCategory: scope === 'category' ? targetCategory : null,
            discountPercent: Number(discountPercent),
            expiresAt: expiresAt || null,
            createdBy: user.id,
        });

        // Notify the matched customer live, if they have an account
        const matchedUser = await User.findOne({
            $or: [
                ...(targetPhone ? [{ phone: targetPhone.trim() }] : []),
                ...(targetEmail ? [{ email: targetEmail.trim().toLowerCase() }] : []),
            ],
        });
        if (matchedUser) {
            pushNotification({
                title: '🎟️ You have a new coupon!',
                message: `${Number(discountPercent)}% off — code ${code.trim().toUpperCase()}`,
                type: 'coupon',
                targetUser: matchedUser._id,
            });
        }

        return NextResponse.json({ success: true, coupon }, { status: 201 });
    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json({ message: 'That coupon code already exists' }, { status: 400 });
        }
        console.error('Coupon create error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}