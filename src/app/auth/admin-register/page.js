'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSetupKey, setShowSetupKey] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        setupKey: '',
    });

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    }

    async function handleSubmit() {
        setError('');

        if (!form.name || !form.email || !form.password || !form.setupKey) {
            return setError('All fields are required');
        }

        if (form.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        if (form.password !== form.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/admin-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    setupKey: form.setupKey,
                }),
            });

            const data = await res.json();
            if (!res.ok) return setError(data.message);

            router.push('/admin');
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-6">
            {/* Max width slightly wider to support two columns cleanly */}
            <div className="glass rounded-3xl w-full max-w-lg p-6 md:p-8">

                {/* Logo & Header Section - reduced margin */}
                <div className="text-center mb-5">
                    <h1 className="text-2xl font-bold text-black tracking-wide">
                        Auhentic
                    </h1>
                    <p className="text-black/50 text-xs mt-0.5">
                        Owner Account Setup
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[#3E2723] text-xs">
                        {error}
                    </div>
                )}

                <div className="space-y-3.5">
                    {/* Row 1: Name & Email Split */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-black/70 text-xs mb-1 block font-medium">
                                Full Name
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Owner name"
                                className="glass-input rounded-3xl text-black text-sm w-full"
                            />
                        </div>
                        <div>
                            <label className="text-black/70 text-xs mb-1 block font-medium">
                                Email Address
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="owner@auhentic.com"
                                className="glass-input rounded-3xl text-black text-sm w-full"
                            />
                        </div>
                    </div>

                    {/* Row 2: Password & Confirm Password Split */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-black/70 text-xs mb-1 block font-medium">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Min 6 characters"
                                    className="glass-input rounded-3xl text-black text-sm w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition"
                                >
                                    {showPassword ? (
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
                        </div>
                        <div>
                            <label className="text-black/70 text-xs mb-1 block font-medium">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repeat password"
                                    className="glass-input rounded-3xl text-black text-sm w-full pr-10"
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
                        </div>
                    </div>

                    {/* Row 3: Full Width Setup Key */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-black/70 text-xs block font-medium">
                                Setup Key
                            </label>
                            <span className="text-black/30 text-[10px]">
                                Provided by developer
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                name="setupKey"
                                type={showSetupKey ? 'text' : 'password'}
                                value={form.setupKey}
                                onChange={handleChange}
                                placeholder="Enter system setup key"
                                className="glass-input rounded-3xl text-black text-sm w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSetupKey(!showSetupKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition"
                            >
                                {showSetupKey ? (
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
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="glass-btn-primary mt-1 w-full"
                    >
                        {loading ? 'Creating Account...' : 'Create Owner Account'}
                    </button>

                    <p className="text-center text-black/50 text-xs pt-1">
                        Already have an account?{' '}
                        <Link
                            href="/auth/login"
                            className="text-[#c8860a] hover:text-[#9a6200] hover:underline font-medium transition"
                        >
                            Login
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}