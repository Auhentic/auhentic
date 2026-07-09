'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getVisitorId } from '@/lib/visitorId';

export default function Tracker() {
    const pathname = usePathname();
    const enterTimeRef = useRef(Date.now());

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