'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

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
                        <input
                            type="password"
                            name="password"
                            placeholder="Your password"
                            value={formData.password}
                            onChange={handleChange}
                            className="glass-input rounded-full py-1.5 px-3 text-sm"
                        />
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