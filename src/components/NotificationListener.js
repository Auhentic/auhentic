'use client';
import { useEffect, useState, useRef } from 'react';

export default function NotificationListener() {
    const [toasts, setToasts] = useState([]);
    const sinceRef = useRef(new Date().toISOString());

    useEffect(() => {
        let cancelled = false;

        async function poll() {
            try {
                const res = await fetch(`/api/notifications?since=${encodeURIComponent(sinceRef.current)}`);
                const data = await res.json();
                if (cancelled) return;

                sinceRef.current = data.serverTime || sinceRef.current;

                if (data.notifications?.length > 0) {
                    const ordered = [...data.notifications].reverse(); // oldest first, stacks naturally
                    setToasts((prev) => [...prev, ...ordered]);
                    ordered.forEach((n) => {
                        setTimeout(() => {
                            setToasts((prev) => prev.filter((t) => t._id !== n._id));
                        }, 7000);
                    });
                }
            } catch {
                // notifications must never break the site
            }
        }

        const interval = setInterval(poll, 15000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full">
            {toasts.map((n) => (
                <a
                    key={n._id}
                    href={n.link || '#'}
                    className="bg-cyan-600 rounded-2xl p-4 shadow-lg border border-black/10 block hover:scale-[1.02] transition"
                >
                    <p className="text-black font-semibold text-sm">{n.title}</p>
                    {n.message && <p className="text-black/60 text-xs mt-1">{n.message}</p>}
                </a>
            ))}
        </div>
    );
}