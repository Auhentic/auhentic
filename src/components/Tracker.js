'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getVisitorId } from '@/lib/visitorId';

export default function Tracker() {
    const pathname = usePathname();
    const enterTimeRef = useRef(Date.now());

    // "Currently online" presence — separate from page/product tracking.
    // Pings every 25s while the tab is open so admin/team can show a
    // live green/red status without waiting for a page navigation.
    useEffect(() => {
        function ping() {
            if (document.visibilityState === 'visible') {
                fetch('/api/presence', { method: 'POST' }).catch(() => { });
            }
        }
        ping();
        const interval = setInterval(ping, 25000);
        document.addEventListener('visibilitychange', ping);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', ping);
        };
    }, []);

    useEffect(() => {
        getVisitorId(); // ensures cookie exists on first load

        // log the page view
        fetch('/api/track', {
            method: 'POST',
            body: JSON.stringify({ type: 'page_view', path: pathname }),
        }).catch(() => { });

        enterTimeRef.current = Date.now();

        // send time-spent-on-this-page when leaving (route change or tab close)
        function sendDuration() {
            const seconds = Math.round((Date.now() - enterTimeRef.current) / 1000);
            if (seconds < 1) return;
            const payload = JSON.stringify({ type: 'heartbeat', path: pathname, durationSeconds: seconds });
            navigator.sendBeacon('/api/track', payload); // reliable even on tab close
        }

        window.addEventListener('beforeunload', sendDuration);
        return () => {
            sendDuration();
            window.removeEventListener('beforeunload', sendDuration);
        };
    }, [pathname]);

    return null;
}