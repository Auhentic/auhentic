'use client';

import { useEffect, useRef } from 'react';
import Sidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }) {
    const lastOrderCount = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        // create audio context for notification sound
        function playNotificationSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();

                // create a beep sound
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, ctx.currentTime);
                oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);

                gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.5);
            } catch {
                // audio not supported
            }
        }

        async function checkNewOrders() {
            try {
                const res = await fetch('/api/orders');
                if (!res.ok) return;
                const data = await res.json();
                const count = data.data?.length || 0;

                if (lastOrderCount.current === null) {
                    // first load — just set the count
                    lastOrderCount.current = count;
                    return;
                }

                if (count > lastOrderCount.current) {
                    // new order arrived!
                    playNotificationSound();
                    lastOrderCount.current = count;
                }
            } catch {
                // fail silently
            }
        }

        // check immediately
        checkNewOrders();

        // then check every 30 seconds
        const interval = setInterval(checkNewOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}