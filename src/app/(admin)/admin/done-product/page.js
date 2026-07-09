'use client';

import { useState, useEffect } from 'react';

const STATUS_COLORS = {
    delivered: 'text-green-400',
    cancelled: 'text-red-400',
};

// Done orders = delivered + cancelled (not archived by admin)
const DONE_STATUSES = ['delivered', 'cancelled'];

export default function AdminDoneProductPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchDoneOrders();
    }, []);

    async function fetchDoneOrders() {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            // Show only delivered/cancelled that are NOT archived by admin
            const doneOrders = (data.data || []).filter(
                (o) => DONE_STATUSES.includes(o.orderStatus) && !o.isArchivedByAdmin
            );
            setOrders(doneOrders);
        } catch {
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(orderId) {
        if (!confirm('Remove this order from the list? This will not affect total revenue.')) return;

        setDeletingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Delete failed');
            setSuccess('Order removed from list.');
            setOrders((prev) => prev.filter((o) => o._id !== orderId));
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to remove order');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-black">Done Orders</h1>
                <p className="text-black/40 text-xs">Delivered &amp; Cancelled</p>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-3xl bg-red-500/20 border border-red-500/30 text-[#3E2723] text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-[#3E2723]/30 text-[#3E2723] text-sm">
                    {success}
                </div>
            )}

            {loading ? (
                <div className="glass p-8 text-center text-black/50">Loading...</div>
            ) : orders.length === 0 ? (
                <div className="glass p-8 text-center text-black/50">No done orders yet.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {orders.map((order) => (
                        <div key={order._id} className="glass p-4 rounded-3xl flex flex-col gap-3">

                            {/* Order Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <p className="text-black text-sm font-medium">
                                        Order #{order.orderNumber ? `AUH-${order.orderNumber}` : order._id.slice(-8).toUpperCase()}
                                    </p>
                                    <p className="text-black/50 text-xs">
                                        {new Date(order.createdAt).toLocaleDateString('en-BD', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-blue-400 font-bold">
                                        ৳{order.total.toLocaleString() || 0}
                                    </p>
                                    {/* Delete button — soft delete only */}
                                    <button
                                        onClick={() => handleDelete(order._id)}
                                        disabled={deletingId === order._id}
                                        className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500/20 transition disabled:opacity-40"
                                    >
                                        {deletingId === order._id ? 'Removing...' : '✕ Remove'}
                                    </button>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="text-black/50 text-xs">
                                <p>
                                    Customer:{' '}
                                    <span className="text-black/70">
                                        {order.user?.name || order.guestInfo?.name || 'Guest'}
                                    </span>
                                </p>
                                <p>
                                    Phone:{' '}
                                    <span className="text-black/70">
                                        {order.shippingAddress?.phone}
                                    </span>
                                </p>
                                <p>
                                    Address:{' '}
                                    <span className="text-black/70">
                                        {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                    </span>
                                </p>
                                <p>
                                    Payment:{' '}
                                    <span className="text-black/70 uppercase">
                                        {order.paymentMethod}
                                    </span>
                                </p>
                            </div>

                            {/* Items */}
                            <div className="flex flex-col gap-1">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-black/70">
                                            {item.name} x{item.quantity}
                                        </span>
                                        <span className="text-black/50">
                                            ৳{(item.price * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Status + Payment Status */}
                            <div className="flex flex-wrap items-center gap-3 mt-1 border-t border-black/10 pt-3">
                                <span className={`text-xs font-medium capitalize ${STATUS_COLORS[order.orderStatus] || 'text-black/50'}`}>
                                    {order.orderStatus}
                                </span>
                                <span className={`text-xs font-medium capitalize ml-auto ${order.paymentStatus === 'paid'
                                    ? 'text-green-500'
                                    : order.paymentStatus === 'cancelled'
                                        ? 'text-red-400'
                                        : 'text-yellow-500'
                                    }`}>
                                    {order.paymentStatus}
                                </span>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}