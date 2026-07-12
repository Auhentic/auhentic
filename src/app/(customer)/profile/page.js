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
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    async function handleChangePassword() {
        setPwError('');
        setPwSuccess('');

        if (pwForm.newPassword !== pwForm.confirmPassword) {
            return setPwError('New passwords do not match');
        }

        setPwSaving(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: pwForm.currentPassword,
                    newPassword: pwForm.newPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) return setPwError(data.message);

            setPwSuccess('Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch {
            setPwError('Something went wrong');
        } finally {
            setPwSaving(false);
        }
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

            <div className="glass p-6 rounded-3xl mt-6 mb-3.5">
                <h3 className="text-black font-semibold text-sm mb-4">Change Password</h3>
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Current password"
                            value={pwForm.currentPassword}
                            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                            className="glass-input rounded-3xl w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition"
                        >
                            {showCurrentPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="New password"
                            value={pwForm.newPassword}
                            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                            className="glass-input rounded-3xl w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition"
                        >
                            {showNewPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={pwForm.confirmPassword}
                            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                            className="glass-input rounded-3xl w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition"
                        >
                            {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {pwError && <p className="text-red-600 text-xs">{pwError}</p>}
                    {pwSuccess && <p className="text-green-600 text-xs">{pwSuccess}</p>}
                    <button
                        onClick={handleChangePassword}
                        disabled={pwSaving}
                        className="glass-btn-primary px-6 py-2 w-auto text-sm"
                    >
                        {pwSaving ? 'Saving...' : 'Change Password'}
                    </button>
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