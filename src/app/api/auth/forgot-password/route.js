import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { sendOTPEmail } from '@/lib/brevo';

export async function POST(request) {
    try {
        await connectDB();

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // same message for security — don't reveal if email exists or not
            return NextResponse.json(
                { message: 'If this email is registered, you will receive an OTP' },
                { status: 200 }
            );
        }

        // delete any previous OTP for this email
        await OTP.deleteMany({ email: email.toLowerCase() });

        // generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // save to DB (auto expires in 10 mins via TTL index)
        await OTP.create({ email: email.toLowerCase(), otp });

        // send email
        await sendOTPEmail(email, otp);

        return NextResponse.json(
            { message: 'If this email is registered, you will receive an OTP' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}