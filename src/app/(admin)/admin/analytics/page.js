'use client';

import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics')
            .then((res) => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="glass rounded-xl p-8 text-center text-black/50">Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-black mb-2">Guest Insights</h1>
            <p className="text-black/50 text-sm mb-8">
                Browsing activity from visitors who haven't created an account
            </p>

            <div className="glass rounded-xl p-4 mb-6">
                <h3 className="text-black font-semibold text-sm mb-3">Most Viewed Products (Guests)</h3>
                <div className="flex flex-col gap-2">
                    {data?.topGuestProducts?.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm text-black/70">
                            <span>{p.name || 'Unknown product'}</span>
                            <span className="text-black/40 text-xs">
                                {p.views} views · last {new Date(p.lastViewedAt).toLocaleString('en-BD', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                            </span>
                        </div>
                    ))}
                    {data?.topGuestProducts?.length === 0 && (
                        <p className="text-black/30 text-sm">No guest product views yet.</p>
                    )}
                </div>
            </div>

            <div className="glass rounded-xl p-4">
                <h3 className="text-black font-semibold text-sm mb-3">Recent Guest Visitors</h3>
                <div className="flex flex-col gap-2">
                    {data?.guestVisitors?.map((v) => (
                        <div key={v._id} className="flex justify-between text-xs text-black/60 border-b border-black/5 pb-2">
                            <span className="font-mono">{v._id.slice(0, 8)}...</span>
                            <span>{v.productViews} product view{v.productViews !== 1 ? 's' : ''}</span>
                            <span className="text-black/30">{new Date(v.lastSeen).toLocaleString('en-BD')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}