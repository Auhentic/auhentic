import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST() {
    try {
        const user = await getAuthUser();
        if (user) {
            await connectDB();
            await User.findByIdAndUpdate(user.id, { lastSeenAt: new Date() });
        }
        return NextResponse.json({ ok: true });
    } catch {
        // presence must never break the site
        return NextResponse.json({ ok: false });
    }
}