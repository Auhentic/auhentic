import connectDB from './mongodb';
import Notification from '@/models/Notification';

// Fire-and-forget helper — notifications must never break the calling route.
export async function pushNotification({ title, message = '', type = 'offer', targetUser = null, link = '' }) {
    try {
        await connectDB();
        await Notification.create({ title, message, type, targetUser, link });
    } catch (err) {
        console.error('pushNotification error:', err);
    }
}