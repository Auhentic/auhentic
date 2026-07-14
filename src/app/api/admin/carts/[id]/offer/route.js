import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { NextResponse } from 'next/server';
import { pushNotification } from '@/lib/notify';

export async function PATCH(req, { params }) {
    await connectDB();
    const { id } = await params;
    const { discountPercent, message, expiresAt } = await req.json();

    const cart = await Cart.findByIdAndUpdate(
        id,
        {
            personalOffer: {
                discountPercent: Number(discountPercent) || 0,
                message: message || '',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                active: true,
            },
        },
        { new: true }
    );

    if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

    if (cart.user) {
        pushNotification({
            title: '🎁 You got a personal offer!',
            message: message || `Enjoy ${discountPercent}% off your cart`,
            type: 'personal',
            targetUser: cart.user,
            link: '/cart',
        });
    }

    return NextResponse.json({ success: true, cart });
}

export async function DELETE(req, { params }) {
    await connectDB();
    const { id } = await params;
    await Cart.findByIdAndUpdate(id, { personalOffer: { active: false, discountPercent: 0, message: '', expiresAt: null } });
    return NextResponse.json({ success: true });
}