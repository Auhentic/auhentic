'use client';

import { useState, useEffect } from 'react';

const ROLE_COLORS = {
    customer: 'text-[#5c3d1e]',
    'sub-admin': 'text-[#c8860a]',
};

const ROLE_BADGES = {
    customer: 'bg-black/10 text-black/60',
    'sub-admin': 'bg-[#c8860a]/20 text-[#c8860a]',
};

export default function TeamPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');

    // useEffect(() => {
    //     fetchUsers();
    // }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchUsers(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    async function fetchUsers(term = '') {
        try {
            const res = await fetch(`/api/admin/team?search=${encodeURIComponent(term)}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Failed to load users');
                setUsers([]);
                return;
            }
            setUsers(data.users || []);
            setError('');
        } catch {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(userId, newRole) {
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/admin/team', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });

            const data = await res.json();
            if (!res.ok) return setError(data.message);

            setSuccess(`User role updated to ${newRole}!`);
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to update role');
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-black mb-2">Team Management</h1>
            <p className="text-black/50 text-sm mb-8">
                Promote customers to sub-admin or demote sub-admins back to customer
            </p>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-[#3E2723] text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-[#3E2723]/30 text-[#3E2723] text-sm">
                    {success}
                </div>
            )}

            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by phone, name, or email..."
                className="glass-input rounded-3xl w-full mb-6"
            />

            {loading ? (
                <div className="glass rounded-xl p-8 text-center text-black/50">
                    Loading users...
                </div>
            ) : users.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center text-black/50">
                    No users yet.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {users.map((user) => (
                        <div
                            key={user._id}
                            className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                            {/* User Info */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-black font-medium text-sm">
                                        {user.name}
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGES[user.role]}`}>
                                        {user.role}
                                    </span>
                                </div>
                                <p className="text-black/50 text-xs">{user.email}</p>
                                {user.phone && (
                                    <p className="text-black/40 text-xs">{user.phone}</p>
                                )}
                                <p className="text-sm text-black/60">
                                    DOB: {user.dateOfBirth
                                        ? new Date(user.dateOfBirth).toLocaleDateString('en-BD')
                                        : 'Not provided'}
                                </p>
                                <div>
                                    <p className="text-black/30 text-xs">
                                        Joined {new Date(user.createdAt).toLocaleDateString('en-BD', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                    <p className="text-black/40 text-xs mt-1">
                                        ⏱ {Math.round(user.totalTimeSeconds / 60)} min on site
                                    </p>
                                    {user.topProducts?.length > 0 && (
                                        <p className="text-black/40 text-xs">
                                            👀 Viewed: {user.topProducts.map((p) => p.name).filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Role Actions */}
                            <div className="flex gap-2">
                                {user.role === 'customer' ? (
                                    <button
                                        onClick={() => handleRoleChange(user._id, 'sub-admin')}
                                        className="glass-btn-primary px-4 py-2 w-auto text-xs"
                                    >
                                        Promote to Sub-Admin
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleRoleChange(user._id, 'customer')}
                                        className="bg-red-500/20 border border-red-500/30 text-red-700 text-xs px-4 py-2 rounded-lg hover:bg-red-500/30 transition w-auto"
                                    >
                                        Demote to Customer
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="glass rounded-xl p-4 mt-6">
                <h3 className="text-black font-semibold text-sm mb-2">
                    Role Permissions
                </h3>
                <div className="flex flex-col gap-1 text-xs text-black/60">
                    <p>✅ Sub-Admin — Can manage products and orders</p>
                    <p>❌ Sub-Admin — Cannot access team or settings</p>
                    <p>✅ Admin (You) — Full access to everything</p>
                </div>
            </div>
        </div>
    );
}