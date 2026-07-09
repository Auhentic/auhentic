import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';

const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
    'base64'
);

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        await Activity.create({
            visitorId: searchParams.get('uid') || 'unknown',
            type: 'pixel',
            meta: { campaign: searchParams.get('c') || '' },
        });
    } catch {
        // never fail the image response
    }

    return new Response(PIXEL, {
        headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' },
    });
}