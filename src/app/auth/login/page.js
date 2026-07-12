'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const [showPassword, setShowPassword] = useState(false);

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    }

    async function handleLogin() {
        setError('');

        if (!formData.email || !formData.password) {
            return setError('Email and password are required');
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();


            console.log('LOGIN RESPONSE:', data); //remove
            console.log('USER ROLE:', data.user?.role); //remove

            if (!res.ok) {
                return setError(data.message);
            }

            console.log('REDIRECTING TO:', data.user.role === 'admin' ? '/admin' : '/');

            if (data.user.role === 'admin' || data.user.role === 'sub-admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/';
            }
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        /* Reduced vertical padding to prevent overflow */
        <div className="min-h-screen flex items-center justify-center px-4 py-4">
            {/* Reduced container max-width to match the registration card and added fully curved corners */}
            <div className="glass w-full max-w-sm p-6 rounded-3xl">

                {/* Logo Section */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-black tracking-wide">
                        Auhentic
                    </h1>
                    <p className="text-black/75 text-xs mt-0.5">Welcome back</p>
                </div>

                {/* Error Box */}
                {error && (
                    <div className="mb-3 p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-[#3E2723] text-xs">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="text-black/75 text-xs mb-0.5 block">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="glass-input rounded-full py-1.5 px-3 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-black/75 text-xs mb-0.5 block">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Your password"
                                value={formData.password}
                                onChange={handleChange}
                                className="glass-input rounded-full py-1.5 px-3 pr-10 text-sm"
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

                    <div className="text-right">
                        <Link
                            href="/auth/forgot-password"
                            className="text-[#c8860a] hover:text-[#9a6200] text-xs"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Button starts flat and changes to a curve strictly on hover */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="glass-btn-primary rounded-none hover:rounded-xl py-2 text-sm"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <p className="text-center text-black/50 text-xs mt-3">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/register" className="text-[#c8860a] hover:text-[#9a6200]">
                            Register
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}