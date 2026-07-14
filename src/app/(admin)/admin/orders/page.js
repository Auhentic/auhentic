'use client';

import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
    'placed',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];

const STATUS_COLORS = {
    placed: 'text-blue-400',
    confirmed: 'text-purple-400',
    processing: 'text-yellow-400',
    shipped: 'text-green-500',
    delivered: 'text-green-400',
    cancelled: 'text-red-400',
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('confirmed');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkPaymentStatus, setBulkPaymentStatus] = useState('paid');
    const [bulkPaymentLoading, setBulkPaymentLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            const activeOrders = (data.data || []).filter(
                (o) => !(o.orderStatus === 'delivered' && o.paymentStatus === 'paid') && o.orderStatus !== 'cancelled'
            );
            setOrders(activeOrders);
        } catch {
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }

    // Single order checkbox toggle
    function toggleSelect(id) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    // Select all / deselect all
    function toggleSelectAll() {
        if (selectedIds.length === orders.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(orders.map((o) => o._id));
        }
    }

    // Bulk status update
    // Bulk status update
    async function handleBulkUpdate() {
        if (selectedIds.length === 0) return;
        setBulkLoading(true);
        setError('');

        try {
            await Promise.all(
                selectedIds.map((id) =>
                    fetch(`/api/orders/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderStatus: bulkStatus }),
                    })
                )
            );
            setSuccess(`${selectedIds.length} order${selectedIds.length > 1 ? 's' : ''} updated to "${bulkStatus}"`);
            setSelectedIds([]);
            fetchOrders();
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Bulk update failed');
        } finally {
            setBulkLoading(false);
        }
    }

    // Bulk payment status update
    async function handleBulkPaymentUpdate() {
        if (selectedIds.length === 0) return;
        setBulkPaymentLoading(true);
        setError('');

        try {
            await Promise.all(
                selectedIds.map((id) =>
                    fetch(`/api/orders/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentStatus: bulkPaymentStatus }),
                    })
                )
            );
            setSuccess(`${selectedIds.length} order${selectedIds.length > 1 ? 's' : ''} payment marked "${bulkPaymentStatus}"`);
            setSelectedIds([]);
            fetchOrders();
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Bulk payment update failed');
        } finally {
            setBulkPaymentLoading(false);
        }
    }

    async function handlePaymentUpdate(orderId, newPaymentStatus) {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: newPaymentStatus }),
            });
            if (!res.ok) throw new Error('Update failed');
            setSuccess(`Payment marked as ${newPaymentStatus}`);
            fetchOrders();
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to update payment status');
        }
    }

    async function handleStatusUpdate(orderId, newOrderStatus) {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderStatus: newOrderStatus }),
            });
            if (!res.ok) throw new Error('Update failed');
            setSuccess(`Order status updated to ${newOrderStatus}`);
            fetchOrders();
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to update order status');
        }
    }

    const allSelected = orders.length > 0 && selectedIds.length === orders.length;
    const someSelected = selectedIds.length > 0;

    return (
        <div>
            <h1 className="text-2xl font-bold text-black mb-8">Orders</h1>

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
                <div className="glass p-8 text-center text-black/50 rounded-3xl">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="glass p-8 text-center text-black/50 rounded-3xl">No active orders.</div>
            ) : (
                <>
                    {/* Bulk Action Bar — appears when any order is selected */}
                    <div className={`sticky top-4 z-20 mb-4 transition-all duration-300 ${someSelected ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                        <div className="glass rounded-3xl p-4 flex flex-wrap items-center gap-3 border border-black/20 shadow-lg">
                            <span className="text-black font-medium text-sm">
                                {selectedIds.length} order{selectedIds.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto flex-wrap">
                                <span className="text-black/50 text-sm">Set all to:</span>
                                <select
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value)}
                                    className="glass-input text-sm py-1.5 px-3 w-auto rounded-3xl text-black"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s} className="bg-[#bbf7d0] text-black">
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkUpdate}
                                    disabled={bulkLoading}
                                    className="glass-btn-primary px-5 py-1.5 w-auto text-sm rounded-3xl text-black"
                                >
                                    {bulkLoading ? 'Updating...' : 'Apply'}
                                </button>

                                <span className="text-black/50 text-sm ml-2">Payment:</span>
                                <select
                                    value={bulkPaymentStatus}
                                    onChange={(e) => setBulkPaymentStatus(e.target.value)}
                                    className="glass-input text-sm py-1.5 px-3 w-auto rounded-3xl text-black"
                                >
                                    {['pending', 'paid', 'failed'].map((s) => (
                                        <option key={s} value={s} className="bg-[#bbf7d0] text-black">
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkPaymentUpdate}
                                    disabled={bulkPaymentLoading}
                                    className="glass-btn-primary px-5 py-1.5 w-auto text-sm rounded-3xl text-black"
                                >
                                    {bulkPaymentLoading ? 'Updating...' : 'Apply'}
                                </button>

                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-black/40 hover:text-black transition text-sm px-2"
                                >
                                    ✕ Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Select All row */}
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 accent-green-600 cursor-pointer"
                        />
                        <span className="text-black/50 text-sm">
                            {allSelected ? 'Deselect all' : `Select all (${orders.length})`}
                        </span>
                    </div>

                    <div className="flex flex-col gap-4">
                        {orders.map((order) => {
                            const isSelected = selectedIds.includes(order._id);
                            return (
                                <div
                                    key={order._id}
                                    className={`glass p-4 rounded-3xl flex flex-col gap-3 transition-all duration-200
                                        ${isSelected ? 'ring-2 ring-green-500/50 bg-green-500/5' : ''}`}
                                >
                                    {/* Checkbox + Order Header */}
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(order._id)}
                                            className="w-4 h-4 accent-green-600 cursor-pointer mt-1 shrink-0"
                                        />
                                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-black text-sm font-medium">
                                                    Order #{order.orderNumber ? `AUH-${order.orderNumber}` : order._id.slice(-8).toUpperCase()}
                                                </p>
                                                <p className="text-black/50 text-xs">
                                                    {new Date(order.createdAt).toLocaleDateString('en-BD', {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <p className="text-blue-400 font-bold">
                                                ৳{order.total.toLocaleString() || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="text-black/50 text-xs pl-7">
                                        <p>Customer: <span className="text-black/70">{order.user?.name || order.guestInfo?.name || 'Guest'}</span></p>
                                        <p>Phone: <span className="text-black/70">{order.shippingAddress?.phone}</span></p>
                                        <p>Address: <span className="text-black/70">{order.shippingAddress?.street}, {order.shippingAddress?.city}</span></p>
                                        <p>Payment: <span className="text-black/70 uppercase">{order.paymentMethod}</span></p>

                                        {order.shippingAddress?.phone && (
                                            <a
                                                href={`https://wa.me/${order.shippingAddress.phone.replace(/^0/, '880')}?text=${encodeURIComponent(
                                                    `Hi ${order.guestInfo?.name || order.user?.name || 'there'},\nconfirming your Auhentic order #${order.orderNumber ? `AUH-${order.orderNumber}` : ''}\ntotal ৳${order.total}.\nReply to confirm!`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-2 glass-btn px-3 py-1.5 text-xs w-auto"
                                            >
                                                📱 Verify on WhatsApp
                                            </a>
                                        )}
                                    </div>

                                    {/* Items */}
                                    <div className="flex flex-col gap-1 pl-7">
                                        {order.items.map((item, i) => (
                                            <div key={i} className="flex flex-col gap-0.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-black/70">{item.name}{item.variant ? ` (${item.variant})` : ''} x{item.quantity}</span>
                                                    <span className="text-black/50">৳{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                                {item.note && (
                                                    <p className="text-amber-700 text-xs italic pl-2">📝 "{item.note}"</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Status Update + Payment */}
                                    <div className="flex flex-wrap items-center gap-3 mt-1 border-t border-black/10 pt-3 pl-7">
                                        <span className={`text-xs font-medium capitalize ${STATUS_COLORS[order.orderStatus]}`}>
                                            {order.orderStatus}
                                        </span>
                                        <select
                                            key={order._id + order.orderStatus}
                                            value={order.orderStatus}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            className="glass-input text-xs py-1 px-2 w-auto rounded-3xl text-black"
                                        >
                                            {STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s} className="bg-[#bbf7d0] text-black">
                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex items-center gap-2 ml-auto">
                                            <span className={`text-xs font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-500'
                                                : order.paymentStatus === 'failed' ? 'text-red-500'
                                                    : 'text-yellow-500'}`}>
                                                {order.paymentStatus}
                                            </span>
                                            {order.paymentStatus !== 'paid' && (
                                                <button
                                                    onClick={() => handlePaymentUpdate(order._id, 'paid')}
                                                    className="text-xs bg-green-500/20 border border-[#3E2723]/30 text-green-700 px-3 py-1 rounded-full hover:bg-green-500/30 transition"
                                                >
                                                    ✓ Mark Paid
                                                </button>
                                            )}
                                            {order.paymentStatus === 'paid' && (
                                                <button
                                                    onClick={() => handlePaymentUpdate(order._id, 'pending')}
                                                    className="text-xs bg-black/5 border border-black/10 text-black/40 px-3 py-1 rounded-full hover:bg-black/10 transition"
                                                >
                                                    Undo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
