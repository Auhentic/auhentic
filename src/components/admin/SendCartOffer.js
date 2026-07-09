'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DateTimePicker from './DateTimePicker';

export default function SendCartOffer({ cartId, existingOffer }) {
    const [open, setOpen] = useState(false);
    const [discount, setDiscount] = useState(existingOffer?.discountPercent || 10);
    const [message, setMessage] = useState(existingOffer?.message || '');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function sendOffer() {
        setLoading(true);
        await fetch(`/api/admin/carts/${cartId}/offer`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                discountPercent: discount,
                message,
                expiresAt: expiresAt || null,
            }),
        });
        setLoading(false);
        setOpen(false);
        router.refresh();
    }

    const isExpired = existingOffer?.expiresAt && new Date(existingOffer.expiresAt).getTime() < Date.now();

    if (existingOffer?.active && !isExpired) {
        return (
            <div className="text-xs text-green-700 bg-green-500/10 px-3 py-1.5 rounded-full inline-block">
                🎁 {existingOffer.discountPercent}% offer sent
                {existingOffer.expiresAt && ` — ends ${new Date(existingOffer.expiresAt).toLocaleString()}`}
            </div>
        );
    }

    return open ? (
        <div className="glass rounded-2xl p-4 mt-2 flex flex-col gap-2">
            <input type="number" min="1" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Discount %" className="glass-input" />
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (optional)" className="glass-input" />
            <div>
                <label className="text-xs text-black/50 mb-1 block">Expires at (leave empty for no time limit)</label>
                <DateTimePicker value={expiresAt} onChange={setExpiresAt} />
            </div>
            <div className="flex gap-2">
                <button onClick={sendOffer} disabled={loading} className="glass-btn-primary text-black text-sm px-4 py-1.5 rounded-full">
                    {loading ? 'Sending...' : 'Send Offer'}
                </button>
                <button onClick={() => setOpen(false)} className="text-black/50 text-sm px-3">Cancel</button>
            </div>
        </div>
    ) : (
        <button onClick={() => setOpen(true)} className="text-xs text-[#c8860a] border border-[#c8860a]/40 px-3 py-1.5 rounded-full hover:bg-[#c8860a]/10">
            + Send personal offer
        </button>
    );
}