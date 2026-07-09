'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const STATUS_STEPS = [
    'placed',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
];

const STATUS_LABELS = {
    placed: 'Order Placed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STATUS_ICONS = {
    placed: '🛒',
    confirmed: '✅',
    processing: '🔧',
    shipped: '🚚',
    delivered: '📦',
    cancelled: '❌',
};

export default function OrderDetailPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isSuccess = searchParams.get('success') === 'true';

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchOrder() {
            try {
                const res = await fetch(`/api/orders/${id}`);
                if (res.status === 401) {
                    router.push('/auth/login');
                    return;
                }
                if (res.status === 403) {
                    router.push('/orders');
                    return;
                }
                const data = await res.json();
                setOrder(data.data);
            } catch {
                setError('Failed to load order');
            } finally {
                setLoading(false);
            }
        }
        fetchOrder();
    }, [id, router]);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <div className="glass rounded-3xl p-12 text-black/50">Loading order...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <div className="glass rounded-3xl p-12 text-black/50">{error || 'Order not found'}</div>
            </div>
        );
    }

    const isCancelled = order.orderStatus === 'cancelled';
    const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">

            {/* Success Banner */}
            {isSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-green-700/20 border border-[#3E2723]/30 text-[#3E2723] text-center">
                    <p className="text-lg font-bold mb-1">🎉 Order Placed Successfully!</p>
                    <p className="text-sm text-[#3E2723]">
                        Thank you for your order. We will confirm it shortly.
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-black">
                        Order #{order.orderNumber ? `AUH-${order.orderNumber}` : order._id.slice(-8).toUpperCase()}
                    </h1>
                    <p className="text-black/40 text-sm mt-1">
                        Placed on{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-BD', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
                <Link
                    href="/orders"
                    className="glass-btn px-4 py-2 w-auto text-sm text-black"
                >
                    ← My Orders
                </Link>
            </div>

            {/* Daraz Style Status Timeline */}
            <div className="glass rounded-3xl p-6 mb-6">
                <h2 className="text-black font-semibold mb-6">Order Status</h2>

                {isCancelled ? (
                    <div className="text-center py-4">
                        <p className="text-4xl mb-2">❌</p>
                        <p className="text-red-400 font-semibold">Order Cancelled</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Steps — line is drawn between the circle centers using padding */}
                        <div className="relative flex justify-between">
                            {/* Track sits behind circles, padded to align with circle centers */}
                            <div className="absolute top-5 left-[5%] right-[5%] h-0.5 bg-black/10" />
                            <div
                                className="absolute top-5 left-[5%] h-0.5 bg-blue-500 transition-all duration-500"
                                style={{
                                    width: currentStep === 0
                                        ? '0%'
                                        : `${(currentStep / (STATUS_STEPS.length - 1)) * 90}%`,
                                }}
                            />
                            {STATUS_STEPS.map((step, index) => {
                                const isDone = index <= currentStep;
                                const isCurrent = index === currentStep;
                                return (
                                    <div
                                        key={step}
                                        className="flex flex-col items-center gap-2 flex-1"
                                    >
                                        {/* Circle */}
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10
                        ${isDone
                                                    ? 'bg-blue-500 border-2 border-blue-400 text-white'
                                                    : 'bg-black/10 border-2 border-black/20'
                                                }
                        ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent' : ''}
                      `}
                                        >
                                            {STATUS_ICONS[step]}
                                        </div>

                                        {/* Label */}
                                        <p
                                            className={`text-xs text-center hidden md:block
                        ${isDone ? 'text-black' : 'text-black/30'}
                        ${isCurrent ? 'font-semibold' : ''}
                      `}
                                        >
                                            {STATUS_LABELS[step]}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile current status label */}
                        <p className="md:hidden text-center text-black font-semibold mt-4 text-sm">
                            {STATUS_LABELS[order.orderStatus]}
                        </p>
                    </div>
                )}
            </div>

            {/* Status History */}
            {order.statusHistory?.length > 0 && (
                <div className="glass rounded-3xl p-6 mb-6">
                    <h2 className="text-black font-semibold mb-4">Tracking History</h2>
                    <div className="flex flex-col gap-3">
                        {[...order.statusHistory].reverse().map((history, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-black/80 text-sm capitalize font-medium">
                                        {STATUS_LABELS[history.status] || history.status}
                                    </p>
                                    {history.note && (
                                        <p className="text-black/40 text-xs">{history.note}</p>
                                    )}
                                    <p className="text-black/30 text-xs mt-0.5">
                                        {new Date(history.updatedAt).toLocaleString('en-BD')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order Items */}
            <div className="glass rounded-3xl p-6 mb-6">
                <h2 className="text-black font-semibold mb-4">Items Ordered</h2>
                <div className="flex flex-col gap-3">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            {/* Image */}
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/5 shrink-0">
                                {item.image ? (
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-black/20 text-xs">
                                        No img
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <p className="text-black text-sm font-medium">{item.name}</p>
                                <p className="text-black/40 text-xs">
                                    ৳{item.price.toLocaleString()} × {item.quantity}
                                </p>
                            </div>

                            {/* Subtotal */}
                            <p className="text-blue-400 font-bold text-sm">
                                ৳{(item.price * item.quantity).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Summary + Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Price Breakdown */}
                <div className="glass rounded-3xl p-6">
                    <h2 className="text-black font-semibold mb-4">Price Breakdown</h2>
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-black/50">Subtotal</span>
                            <span className="text-black">
                                ৳{order.subtotal?.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-black/50">Shipping</span>
                            <span className={order.shippingCost === 0 ? 'text-green-400' : 'text-black'}>
                                {order.shippingCost === 0 ? 'Free' : `৳${order.shippingCost}`}
                            </span>
                        </div>
                        <div className="border-t border-black/10 pt-2 flex justify-between">
                            <span className="text-black font-bold">Total</span>
                            <span className="text-blue-400 font-bold">
                                ৳{order.total?.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-black/50">Payment</span>
                            <span className="text-black/70 uppercase text-xs">
                                {order.paymentMethod}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-black/50">Payment Status</span>
                            <span className={`text-xs capitalize
                ${order.paymentStatus === 'paid'
                                    ? 'text-green-600'
                                    : order.paymentStatus === 'cancelled'
                                        ? 'text-red-500'
                                        : 'text-yellow-600'
                                }`}
                            >
                                {order.paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="glass rounded-3xl p-6">
                    <h2 className="text-black font-semibold mb-4">Delivery Address</h2>
                    <div className="flex flex-col gap-1 text-sm text-black/60">
                        <p className="text-black font-medium">
                            {order.shippingAddress?.phone}
                        </p>
                        <p>{order.shippingAddress?.street}</p>
                        <p>
                            {order.shippingAddress?.city},{' '}
                            {order.shippingAddress?.district}
                        </p>
                        {order.shippingAddress?.postalCode && (
                            <p>{order.shippingAddress.postalCode}</p>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}