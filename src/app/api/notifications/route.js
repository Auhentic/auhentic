import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
    try {
        await connectDB();
        const user = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since');

        const filter = {
            $or: [{ targetUser: null }, ...(user ? [{ targetUser: user.id }] : [])],
        };
        if (since) filter.createdAt = { $gt: new Date(since) };

        const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(20);

        return NextResponse.json({ notifications, serverTime: new Date().toISOString() }, { status: 200 });
    } catch (error) {
        console.error('Notifications GET error:', error);
        return NextResponse.json({ notifications: [], serverTime: new Date().toISOString() }, { status: 200 });
    }
}