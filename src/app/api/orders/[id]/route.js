import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { getAuthUser } from '@/lib/auth';

// GET single order
export async function GET(request, { params }) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { message: 'Login required!' },
                { status: 401 }
            );
        }

        await connectDB();
        const { id } = await params;

        const order = await Order.findById(id)
            .populate('user', 'name email phone');

        if (!order) {
            return NextResponse.json(
                { message: 'Order not found!' },
                { status: 404 }
            );
        }

        // Customer can only see their own order!
        if (user.role !== 'admin' && order.user?._id.toString() !== user.id) {
            return NextResponse.json(
                { message: 'Access denied!' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { success: true, data: order },
            { status: 200 }
        );

    } catch (err) {
        return NextResponse.json(
            { message: err.message },
            { status: 500 }
        );
    }
}

// PATCH update order status (admin only)
export async function PATCH(request, { params }) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Admin access required!' },
                { status: 403 }
            );
        }

        await connectDB();
        const { id } = await params;
        const { orderStatus, paymentStatus } = await request.json();

        // BUG FIX: Must use proper MongoDB update operators.
        // Mixing plain fields with $push in one object is invalid — 
        // it must be { $set: {...}, $push: {...} }
        const setFields = {};
        const pushFields = {};

        if (orderStatus) {
            setFields.orderStatus = orderStatus;
            pushFields.statusHistory = {
                status: orderStatus,
                note: `Status updated to ${orderStatus}`,
                updatedAt: new Date(),
            };

            // Auto set paymentStatus to cancelled when order is cancelled
            if (orderStatus === 'cancelled') {
                setFields.paymentStatus = 'cancelled';
            }
        }

        // Manual paymentStatus override — but never overwrite auto-cancelled
        if (paymentStatus && setFields.paymentStatus !== 'cancelled') {
            setFields.paymentStatus = paymentStatus;
        }

        const updateOp = { $set: setFields };
        if (Object.keys(pushFields).length > 0) {
            updateOp.$push = pushFields;
        }

        const order = await Order.findByIdAndUpdate(
            id,
            updateOp,
            { new: true, runValidators: true }
        );

        if (!order) {
            return NextResponse.json(
                { message: 'Order not found!' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: order },
            { status: 200 }
        );

    } catch (err) {
        return NextResponse.json(
            { message: err.message },
            { status: 500 }
        );
    }
}

// DELETE — soft delete (archive) an order from admin done-product view
// This only hides the card from admin UI. Revenue is NOT affected.
export async function DELETE(request, { params }) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Admin access required!' },
                { status: 403 }
            );
        }

        await connectDB();
        const { id } = await params;

        const order = await Order.findByIdAndUpdate(
            id,
            { isArchivedByAdmin: true },
            { new: true }
        );

        if (!order) {
            return NextResponse.json(
                { message: 'Order not found!' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Order archived successfully' },
            { status: 200 }
        );

    } catch (err) {
        return NextResponse.json(
            { message: err.message },
            { status: 500 }
        );
    }
}
