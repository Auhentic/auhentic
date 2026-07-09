import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { sendOTPEmail } from '@/lib/brevo';

export async function POST(request) {
    try {
        console.log('1 — send-otp hit');

        await connectDB();
        console.log('2 — DB connected');

        const { email } = await request.json();
        console.log('3 — email received:', email);

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email already registered' },
                { status: 409 }
            );
        }
        console.log('4 — email not duplicate');

        await OTP.deleteMany({ email: email.toLowerCase() });
        console.log('5 — old OTPs cleared');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('6 — OTP generated');

        await OTP.create({ email: email.toLowerCase(), otp });
        console.log('7 — OTP saved to DB');

        await sendOTPEmail(email, otp);
        console.log('8 — email sent');

        return NextResponse.json(
            { message: 'OTP sent to your email' },
            { status: 200 }
        );
    } catch (error) {
        console.error('SEND OTP ERROR:', error.message);
        console.error('FULL ERROR:', error);
        return NextResponse.json(
            { message: 'Failed to send OTP' },
            { status: 500 }
        );
    }
}