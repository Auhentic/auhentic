'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_COLORS = {
    placed: 'text-blue-600',
    confirmed: 'text-purple-600',
    processing: 'text-yellow-600',
    shipped: 'text-green-700',
    delivered: 'text-green-600',
    cancelled: 'text-red-600',
};

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch('/api/orders');
                if (res.status === 401) {
                    router.push('/auth/login');
                    return;
                }
                const data = await res.json();
                setOrders(data.data || []);
            } catch {
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, [router]);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <div className="glass rounded-3xl p-12 text-black/50">Loading your orders...</div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-black mb-8">My Orders</h1>

            {error && (
                <div className="p-3 rounded-3xl bg-red-500/20 border border-red-500/30 text-[#3E2723] text-sm mb-4">
                    {error}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center">
                    <p className="text-black/50 text-lg mb-6">No orders yet!</p>
                    <Link
                        href="/"
                        className="glass-btn-primary px-8 py-3 w-auto inline-block text-black"
                    >
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {orders.map((order) => (
                        <Link
                            key={order._id}
                            href={`/orders/${order._id}`}
                            className="glass rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-black/30 transition text-black"
                        >
                            {/* Order Info */}
                            <div>
                                <p className="text-black font-medium text-sm">
                                    Order #{order.orderNumber ? `AUH-${order.orderNumber}` : order._id.slice(-8).toUpperCase()}
                                </p>
                                <p className="text-black/40 text-xs mt-1">
                                    {new Date(order.createdAt).toLocaleDateString('en-BD', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </p>
                                <p className="text-black/50 text-xs mt-1">
                                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* Right Side */}
                            <div className="flex flex-col md:items-end gap-1">
                                <p className="text-blue-600 font-bold">
                                    ৳{order.total?.toLocaleString() || order.totalPrice?.toLocaleString()}
                                </p>
                                <span className={`text-xs font-medium capitalize ${STATUS_COLORS[order.orderStatus]}`}>
                                    {order.orderStatus}
                                </span>
                                <span className="text-black/40 text-xs uppercase">
                                    {order.paymentMethod}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}