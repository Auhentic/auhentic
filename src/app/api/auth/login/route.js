import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'; // add to top imports

export async function POST(request) {
    try {
        await connectDB();

        const { email, password } = await request.json();

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const emailLimit = checkRateLimit(`login:email:${email.toLowerCase()}`, 8, 10 * 60 * 1000);
        if (!emailLimit.allowed) {
            return NextResponse.json(
                { message: `Too many login attempts. Try again in ${Math.ceil(emailLimit.retryAfterSeconds / 60)} minute(s).` },
                { status: 429 }
            );
        }

        const ip = getClientIp(request);
        const ipLimit = checkRateLimit(`login:ip:${ip}`, 20, 10 * 60 * 1000);
        if (!ipLimit.allowed) {
            return NextResponse.json(
                { message: `Too many login attempts from this network. Try again in ${Math.ceil(ipLimit.retryAfterSeconds / 60)} minute(s).` },
                { status: 429 }
            );
        }

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Compare password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Sign JWT and set httpOnly cookie
        const token = signToken({ id: user._id, role: user.role });

        const response = NextResponse.json(
            {
                message: 'Login successful',
                user:
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 200 }
        );

        response.cookies.set(
            'token',
            token,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
            }
        );

        return response;
    }
    catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}