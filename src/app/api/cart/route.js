import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { getAuthUser } from '@/lib/auth';

// GET — admin sees all carts, customer sees their own
export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await connectDB();

        if (user.role === 'admin') {
            const carts = await Cart.find({ 'items.0': { $exists: true } })
                .populate('user', 'name email phone')
                .sort({ updatedAt: -1 });
            return NextResponse.json({ success: true, data: carts }, { status: 200 });
        }

        // Customer — return their own cart
        const cart = await Cart.findOne({ user: user.id });
        return NextResponse.json({ success: true, data: cart || { items: [] } }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// POST — sync cart from localStorage to DB (logged-in users only)
export async function POST(request) {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const { items } = await request.json();

        if (!items || items.length === 0) {
            // Cart is empty — delete from DB
            await Cart.findOneAndDelete({ user: user.id });
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Upsert — create or update
        const cart = await Cart.findOneAndUpdate(
            { user: user.id },
            { items, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: cart }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// DELETE — clear cart from DB (on order placed or manual clear)
export async function DELETE() {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await connectDB();
        await Cart.findOneAndDelete({ user: user.id });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
