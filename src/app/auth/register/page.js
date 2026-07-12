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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="Min 6 chars"
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

                            <div>
                                <label className="text-black/70 text-xs mb-0.5 block">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="Repeat it"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="glass-input rounded-full py-1.5 px-3 pr-10 text-sm"
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