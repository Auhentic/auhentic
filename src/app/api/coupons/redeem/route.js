import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
    try {
        await connectDB();
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ valid: false, message: 'Enter a coupon code' }, { status: 400 });
        }

        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
        if (!coupon) {
            return NextResponse.json({ valid: false, message: 'Invalid or expired coupon code' }, { status: 404 });
        }
        if (coupon.usedInOrder) {
            return NextResponse.json({ valid: false, message: 'This coupon has already been used' }, { status: 400 });
        }
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ valid: false, message: 'This coupon has expired' }, { status: 400 });
        }

        // Identity check — always pulled from the logged-in user's real
        // profile. getAuthUser() only decodes the JWT (id + role), so we
        // fetch the actual account to get phone/email.
        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ valid: false, message: 'Please log in to use a coupon' }, { status: 401 });
        }
        const dbUser = await User.findById(authUser.id).select('phone email');

        const phoneMatches = coupon.targetPhone && dbUser?.phone && coupon.targetPhone === dbUser.phone;
        const emailMatches = coupon.targetEmail && dbUser?.email && coupon.targetEmail === dbUser.email?.toLowerCase();

        if (!phoneMatches && !emailMatches) {
            return NextResponse.json({ valid: false, message: 'This coupon is not valid for you' }, { status: 403 });
        }

        return NextResponse.json({
            valid: true,
            discountPercent: coupon.discountPercent,
            scope: coupon.scope,
            targetProduct: coupon.targetProduct,
            targetCategory: coupon.targetCategory,
            code: coupon.code,
        }, { status: 200 });
    } catch (error) {
        console.error('Coupon redeem error:', error);
        return NextResponse.json({ valid: false, message: 'Something went wrong' }, { status: 500 });
    }
}