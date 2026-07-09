'use client';
import { useEffect, useState } from 'react';

// Ticking countdown shown as hour:minute:second only (no "days" — hours
// just keep counting past 24, e.g. "36:05:20") per design spec.
export default function OfferCountdown({ expiresAt, className = '' }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft(null);
                return;
            }
            const totalHours = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const pad = (n) => String(n).padStart(2, '0');
            setTimeLeft(`${pad(totalHours)}:${pad(m)}:${pad(s)}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    if (!expiresAt || !timeLeft) return null;

    return (
        <p className={`text-red-600 text-xs font-medium animate-pulse ${className}`}>
            ⏰ {timeLeft}
        </p>
    );
}