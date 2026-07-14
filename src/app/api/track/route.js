import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import Product from '@/models/Product';
import { getAuthUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        await connectDB();
        const user = await getAuthUser(); // null for guests, fine
        const cookieStore = await cookies();
        const visitorId = cookieStore.get('visitor_id')?.value || 'unknown';

        // sendBeacon sends text/plain — handle both that and normal JSON
        const raw = await request.text();
        const body = JSON.parse(raw || '{}');

        // Snapshot the product name now, so it stays correct forever
        // even if the product is later renamed or deleted.
        let productName = '';
        if (body.type === 'product_view' && body.productId) {
            const p = await Product.findById(body.productId).select('name');
            productName = p?.name || '';
        }

        await Activity.create({
            user: user?.id || null,
            visitorId,
            type: body.type,
            path: body.path || '',
            product: body.productId || null,
            productName,
            durationSeconds: body.durationSeconds || 0,
        });

        return NextResponse.json({ ok: true });
    } catch {
        // tracking must never break the site
        return NextResponse.json({ ok: false });
    }
}