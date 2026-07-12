import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request) {
    try {
        await connectDB();

        const decoded = await getAuthUser();
        if (!decoded) {
            return NextResponse.json({ message: 'Login required' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'Both fields are required' }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ message: 'New password must be at least 6 characters' }, { status: 400 });
        }

        const user = await User.findById(decoded.id).select('+password');
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
        }

        user.password = newPassword; // pre('save') hook re-hashes this automatically
        await user.save();

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}