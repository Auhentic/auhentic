import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request) {
    try {
        await connectDB();

        const { name, email, phone, password, otp, photo } = await request.json();

        if (!name || !email || !phone || !password || !otp) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        // find OTP record
        const otpRecord = await OTP.findOne({ email: email.toLowerCase() });

        if (!otpRecord) {
            return NextResponse.json(
                { message: 'OTP expired or not found. Please request a new one.' },
                { status: 400 }
            );
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json(
                { message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // OTP valid — delete it
        await OTP.deleteMany({ email: email.toLowerCase() });

        // create user
        const user = await User.create({ 
            name, 
            email, 
            phone,
            password, 
            photo: photo || { url: '', publicId: '' }, 
        });

        const token = signToken({
            id: user._id,
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json(
            {
                message: 'Account created successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );

        setTokenCookie(response, token);
        return response;
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}