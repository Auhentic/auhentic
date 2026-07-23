import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request) {
    try {
        await connectDB();

        const decoded = await getAuthUser();
        if (!decoded) {
            return NextResponse.json(
                { message: 'Login required' },
                { status: 401 }
            );
        }

        const { name, phone, address, dateOfBirth, gender, photo } = await request.json();

        if (!name || !phone || !gender) {
            return NextResponse.json(
                { message: 'Name, Gender and phone are required' },
                { status: 400 }
            );
        }

        const updateFields = {
            name,
            phone,
            address,
            gender,
            dateOfBirth: dateOfBirth || null,
        };
        if (photo) updateFields.photo = photo; // { url, publicId }

        const user = await User.findByIdAndUpdate(
            decoded.id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Profile updated successfully', user },
            { status: 200 }
        );
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}