'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1: email, 2: otp+new password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    async function handleSendOTP() {
        setError('');

        if (!email) return setError('Email is required');

        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) return setError(data.message);

            setSuccess('OTP sent to your email!');
            setStep(2);
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword() {
        setError('');

        if (!otp || otp.length !== 6) return setError('Enter the 6-digit OTP');
        if (!newPassword || newPassword.length < 6)
            return setError('Password must be at least 6 characters');
        if (newPassword !== confirmPassword)
            return setError('Passwords do not match');

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) return setError(data.message);

            setSuccess('Password reset successful! Redirecting to login...');
            setTimeout(() => (window.location.href = '/auth/login'), 2000);
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        /* Reduced vertical padding space to match the other layout styles */
        <div className="min-h-screen flex items-center justify-center px-4 py-4">
            {/* Reduced container to max-w-sm and applied fully curved corners */}
            <div className="glass w-full max-w-sm p-6 rounded-3xl">

                {/* Logo Section */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-black tracking-wide">
                        Auhentic
                    </h1>
                    <p className="text-black/75 text-xs mt-0.5">
                        {step === 1 ? 'Reset your password' : 'Enter new password'}
                    </p>
                </div>

                {/* Error Box */}
                {error && (
                    <div className="mb-3 p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-[#3E2723] text-xs">
                        {error}
                    </div>
                )}

                {/* Success Box */}
                {success && (
                    <div className="mb-3 p-2 rounded-xl bg-green-500/20 border border-[#3E2723]/30 text-[#3E2723] text-xs">
                        {success}
                    </div>
                )}

                {/* Step 1 — Email */}
                {step === 1 && (
                    <div className="space-y-3">
                        <div>
                            <label className="text-black/75 text-xs mb-0.5 block">
                                Registered Email
                            </label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                className="glass-input rounded-full py-1.5 px-3 text-sm"
                            />
                        </div>

                        {/* Button explicitly starts flat and shifts to rounded-xl on hover */}
                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="glass-btn-primary rounded-none hover:rounded-xl py-2 text-sm"
                        >
                            {loading ? 'Sending OTP...' : 'Send Reset Code'}
                        </button>

                        <p className="text-center text-black/50 text-xs mt-3">
                            Remember your password?{' '}
                            <Link href="/auth/login" className="text-[#c8860a] hover:text-[#9a6200]">
                                Login
                            </Link>
                        </p>
                    </div>
                )}

                {/* Step 2 — OTP + New Password */}
                {step === 2 && (
                    <div className="space-y-3">
                        <p className="text-black/60 text-xs text-center">
                            Code sent to{' '}
                            <span className="text-black font-medium">{email}</span>
                        </p>

                        <div>
                            <label className="text-black/75 text-xs mb-0.5 block">OTP Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="••••••"
                                value={otp}
                                onChange={(e) => {
                                    setOtp(e.target.value);
                                    setError('');
                                }}
                                className="glass-input text-center text-xl tracking-widest rounded-full py-1.5"
                            />
                        </div>

                        <div>
                            <label className="text-black/75 text-xs mb-0.5 block">New Password</label>
                            <input
                                type="password"
                                placeholder="Min 6 characters"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setError('');
                                }}
                                className="glass-input rounded-full py-1.5 px-3 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-black/75 text-xs mb-0.5 block">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                placeholder="Repeat new password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setError('');
                                }}
                                className="glass-input rounded-full py-1.5 px-3 text-sm"
                            />
                        </div>

                        {/* Buttons explicitly start flat and shift to rounded-xl on hover */}
                        <button
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="glass-btn-primary rounded-none hover:rounded-xl py-2 text-sm"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <button
                            onClick={() => {
                                setStep(1);
                                setError('');
                                setSuccess('');
                                setOtp('');
                            }}
                            className="glass-btn rounded-none hover:rounded-xl py-2 text-sm"
                        >
                            Back
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}