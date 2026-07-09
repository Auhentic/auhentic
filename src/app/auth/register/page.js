'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// FIX 1: Import Next.js Image component
import Image from 'next/image';

export default function RegisterPage() {
    const router = useRouter();

    const [step, setStep] = useState(1); // step 1: form, step 2: otp
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    // FIX 3: Added photo placeholder inside formData so it persists across step changes
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        photo: null,
    });

    const [otp, setOtp] = useState('');

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    }

    async function handleSendOTP() {
        setError('');

        const { name, email, phone, password, confirmPassword } = formData;

        // FIX 2: Moved validation to the top BEFORE running file uploads
        if (!name || !email || !phone || !password || !confirmPassword) {
            return setError('All fields are required');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            // upload photo if selected — store inside updated state layout
            let uploadedPhoto = null;
            if (photoFile) {
                const fd = new FormData();
                fd.append('image', photoFile);
                const uploadRes = await fetch('/api/upload/public', {
                    method: 'POST',
                    body: fd,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedPhoto = { url: uploadData.url, publicId: uploadData.publicId };
                }
            }

            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                return setError(data.message);
            }

            // Update form data state with the uploaded photo fields before proceeding to Step 2
            setFormData(prev => ({ ...prev, photo: uploadedPhoto }));
            setSuccess('OTP sent to your email!');
            setStep(2);
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOTP() {
        setError('');

        if (!otp || otp.length !== 6) {
            return setError('Please enter the 6-digit OTP');
        }

        setLoading(true);

        try {
            // The formData payload now safely carries your photo object down to your server payload
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...formData, 
                    otp, 
                    photo: photoData,
                 }),
            });

            const data = await res.json();

            if (!res.ok) {
                return setError(data.message);
            }

            router.push('/');
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-4">
            <div className="glass w-full max-w-sm p-6 rounded-3xl">

                {/* Logo Section */}
                <div className="text-center mb-4">
                    <h1 className="text-2xl font-bold text-black tracking-wide">
                        Auhentic
                    </h1>
                    <p className="text-black/50 text-xs mt-0.5">
                        {step === 1 ? 'Create your account' : 'Verify your email'}
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

                {/* Profile Photo — Optional */}
                <div className="mb-3">
                    <label className="text-black/70 text-sm mb-1 block">
                        Profile Photo
                        <span className="text-black/30 ml-1">(optional)</span>
                    </label>

                    <div className="flex items-center gap-4">
                        {/* Preview */}
                        {photoPreview ? (
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#c8860a]/30 shrink-0">
                                <Image
                                    src={photoPreview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center shrink-0 text-black/30 text-xs">
                                No photo
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setPhotoFile(file);
                                setPhotoPreview(URL.createObjectURL(file));
                            }}
                            className="glass-input text-sm"
                        />
                    </div>
                </div>

                {/* Step 1 — Registration Form */}
                {step === 1 && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-black/70 text-xs mb-0.5 block">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="glass-input rounded-full py-1.5 px-3 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-black/70 text-xs mb-0.5 block">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="01XXXXXXXXX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="glass-input rounded-full py-1.5 px-3 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-black/70 text-xs mb-0.5 block">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                className="glass-input rounded-full py-1.5 px-3 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-black/70 text-xs mb-0.5 block">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Min 6 chars"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="glass-input rounded-full py-1.5 px-3 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-black/70 text-xs mb-0.5 block">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Repeat it"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="glass-input rounded-full py-1.5 px-3 text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="glass-btn-primary mt-1 w-full rounded-none hover:rounded-xl transition-all duration-200 py-2 text-sm"
                        >
                            {loading ? 'Sending OTP...' : 'Send Verification Code'}
                        </button>

                        <p className="text-center text-black/50 text-xs mt-2">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-[#c8860a] hover:text-[#9a6200] hover:underline transition font-medium">
                                Login
                            </Link>
                        </p>
                    </div>
                )}

                {/* Step 2 — OTP Verification */}
                {step === 2 && (
                    <div className="space-y-3">
                        <p className="text-black/60 text-xs text-center">
                            We sent a code to{' '}
                            <span className="text-black font-medium">{formData.email}</span>
                        </p>

                        <div>
                            <label className="text-black/70 text-xs mb-0.5 block text-center">Enter OTP</label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="••••••"
                                value={otp}
                                onChange={(e) => {
                                    setOtp(e.target.value);
                                    setError('');
                                }}
                                className="glass-input w-full text-center text-xl tracking-widest rounded-full py-1.5"
                            />
                        </div>

                        <button
                            onClick={handleVerifyOTP}
                            disabled={loading}
                            className="glass-btn-primary w-full rounded-none hover:rounded-xl py-2 text-sm"
                        >
                            {loading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>

                        <button
                            onClick={() => {
                                setStep(1);
                                setError('');
                                setSuccess('');
                                setOtp('');
                            }}
                            className="glass-btn w-full rounded-none hover:rounded-xl transition-all duration-200 py-2 text-sm"
                        >
                            Back
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}