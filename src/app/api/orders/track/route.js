import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const orderNumber = searchParams.get('orderNumber');
        const phone = searchParams.get('phone');

        if (!orderNumber || !phone) {
            return NextResponse.json({ message: 'Order number and phone are required' }, { status: 400 });
        }

        // Strip any "AUH-" prefix (or other non-digit characters) the customer might type,
        // since orderNumber is stored as a plain Number in the DB.
        const cleanedOrderNumber = Number(orderNumber.trim().replace(/\D/g, ''));

        if (!cleanedOrderNumber) {
            return NextResponse.json({ message: 'Please enter a valid order number' }, { status: 400 });
        }

        const order = await Order.findOne({
            orderNumber: cleanedOrderNumber,
            'shippingAddress.phone': phone.trim(),
        });

        if (!order) {
            return NextResponse.json({ message: 'No matching order found. Check your order number and phone.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, orderId: order._id }, { status: 200 });
    } catch (error) {
        console.error('Track order error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}