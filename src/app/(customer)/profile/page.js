'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dobType, setDobType] = useState('text');

    const [form, setForm] = useState({
        name: '',
        phone: '',
        line1: '',       // ← was street
        city: '',
        district: '',
        zip: '',         // ← was postalCode
    });

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push('/auth/login');
                    return;
                }
                const data = await res.json();
                const u = data.user;
                setForm({
                    name: u.name || '',
                    phone: u.phone || '',
                    street: u.address?.street || '',
                    city: u.address?.city || '',
                    district: u.address?.district || '',
                    postalCode: u.address?.postalCode || '',
                    dateOfBirth: u.dateOfBirth || '',
                });
            } catch {
                router.push('/auth/login');
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [router]);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    }

    async function handleSave() {
        setError('');
        setSuccess('');

        if (!form.name || !form.phone) {
            return setError('Name and phone are required');
        }

        setSaving(true);

        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                    address: {
                        street: form.street,     // ← was street
                        city: form.city,
                        district: form.district,
                        postalCode: form.postalCode,         // ← was postalCode
                    },
                    dateOfBirth: form.dateOfBirth,
                }),
            });

            const data = await res.json();
            if (!res.ok) return setError(data.message);
            setSuccess('Profile updated successfully!');
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="glass rounded-3xl p-12 text-black/50">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-black">My Profile</h1>
                <Link href="/orders" className="glass-btn px-4 py-2 w-auto text-sm">
                    My Orders
                </Link>
            </div>

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

            {/* Personal Info */}
            <div className="glass rounded-3xl p-6 mb-4">
                <h2 className="text-black font-semibold mb-4">Personal Information</h2>
                <div className="flex flex-col gap-4">

                    <div>
                        <label className="text-black/70 text-sm mb-1 block">
                            Full Name *
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your full name"
                            className="glass-input rounded-3xl text-black"
                        />
                    </div>

                    <div>
                        <label className="text-black/70 text-sm mb-1 block">
                            Phone Number *
                        </label>
                        <input
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="01XXXXXXXXX"
                            className="glass-input rounded-3xl text-black"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-black/60">Date of Birth</label>
                        <input
                            type={dobType}
                            value={form.dateOfBirth ? new Date(form.dateOfBirth).toISOString().split('T')[0] : ''}
                            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                            onFocus={() => setDobType('date')}
                            onBlur={() => !form.dateOfBirth && setDobType('text')}
                            placeholder="Your special day matters to us 🎂"
                            className="glass-input rounded-3xl w-full"
                        />
                    </div>

                </div>
            </div>

            {/* Default Address */}
            <div className="glass rounded-3xl p-6 mb-6">
                <h2 className="text-black font-semibold mb-4">
                    Default Delivery Address
                </h2>
                <p className="text-black/40 text-xs mb-4">
                    This will be pre-filled at checkout automatically
                </p>
                <div className="flex flex-col gap-4">

                    <div>
                        <label className="text-black/70 text-sm mb-1 block">
                            Street Address
                        </label>
                        <input
                            name="street"
                            value={form.street}
                            onChange={handleChange}
                            placeholder="House, Road, Area"
                            className="glass-input rounded-3xl text-black"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-black/70 text-sm mb-1 block">City</label>
                            <input
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="Dhaka"
                                className="glass-input rounded-3xl text-black"
                            />
                        </div>
                        <div>
                            <label className="text-black/70 text-sm mb-1 block">
                                District
                            </label>
                            <input
                                name="district"
                                value={form.district}
                                onChange={handleChange}
                                placeholder="Dhaka"
                                className="glass-input rounded-3xl text-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-black/70 text-sm mb-1 block">
                            Postal Code (optional)
                        </label>
                        <input
                            name="postalCode"
                            value={form.postalCode}
                            onChange={handleChange}
                            placeholder="1207"
                            className="glass-input rounded-3xl text-black"
                        />
                    </div>

                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="glass-btn-primary py-3 text-base font-bold"
            >
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}