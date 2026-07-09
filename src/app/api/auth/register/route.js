import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request) {
    try {
        await connectDB();

        const { name, email, password, phone } = await request.json();

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Name, email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email already registered' },
                { status: 409 }
            );
        }

        // Create user (password auto-hashed by pre-save hook)
        const user = await User.create(
            {
                name,
                email,
                password,
                phone: phone || '',
                role: 'customer',
            }
        );

        // Sign JWT and set httpOnly cookie
        const token = signToken({ id: user._id, role: user.role });

        const response = NextResponse.json(
            {
                message: 'Registration successful',
                user:
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
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
        console.error('Register error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}