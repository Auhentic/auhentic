import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request) {
    try {
        await connectDB();

        const { name, email, password, setupKey } = await request.json();

        // validate setup key
        if (setupKey !== process.env.ADMIN_SETUP_KEY) {
            return NextResponse.json(
                { message: 'Invalid setup key' },
                { status: 403 }
            );
        }

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return NextResponse.json(
                { message: 'Admin account already exists. Please login.' },
                { status: 409 }
            );
        }

        // check email duplicate
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email already registered' },
                { status: 409 }
            );
        }

        // create admin user
        const user = await User.create({
            name,
            email,
            password,
            role: 'admin',
        });

        const token = signToken({
            id: user._id,
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json(
            {
                message: 'Admin account created successfully',
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
        console.error('Admin register error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}