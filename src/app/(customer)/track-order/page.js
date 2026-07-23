'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackOrderPage() {
    const router = useRouter();
    const [orderNumber, setOrderNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleTrack() {
        setError('');
        if (!orderNumber || !phone) {
            return setError('Please enter both your order number and phone number');
        }

        setLoading(true);
        try {
            const res = await fetch(
                `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
            );
            const data = await res.json();
            if (!res.ok) return setError(data.message);

            router.push(`/orders/${data.orderId}?phone=${encodeURIComponent(phone)}`);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="glass rounded-3xl p-6">
                <h1 className="text-xl font-bold text-black mb-2">Track Your Order</h1>
                <p className="text-black/50 text-sm mb-6">
                    Enter your order number and the phone number you used at checkout.
                </p>

                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        // placeholder="Order number (e.g. AUH-1023 or 1023)"
                        placeholder="Order number (e.g. WEB-AUH-1023 or 1023)"
                        className="glass-input rounded-3xl"
                    />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number used at checkout"
                        className="glass-input rounded-3xl"
                    />
                    {error && <p className="text-red-600 text-xs">{error}</p>}
                    <button
                        onClick={handleTrack}
                        disabled={loading}
                        className="glass-btn-primary py-3 rounded-3xl text-sm font-bold"
                    >
                        {loading ? 'Searching...' : 'Track Order'}
                    </button>
                </div>
            </div>
        </div>
    );
}