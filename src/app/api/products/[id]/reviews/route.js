import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';  // ← add this line

// POST add review (logged in customers only)
export async function POST(request, { params }) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Login required to review!' },
                { status: 401 }
            );
        }

        await connectDB();
        const { id } = await params;
        const { rating, comment } = await request.json();

        if (!rating || !comment) {
            return NextResponse.json(
                { success: false, error: 'Rating and comment required!' },
                { status: 400 }
            );
        }

        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found!' },
                { status: 404 }
            );
        }

        // Check if already reviewed
        const alreadyReviewed = product.reviews.find(
            r => r.user.toString() === user.id
        );
        if (alreadyReviewed) {
            return NextResponse.json(
                { success: false, error: 'You already reviewed this product!' },
                { status: 409 }
            );
        }

        // const User = await import('@/models/User');
        // const dbUser = await User .default.findById(user.id).select('name');
        const dbUser = await User.findById(user.id).select('name photo');

        // Add review
        product.reviews.push({
            user: user.id,
            name: dbUser?.name || 'Customer', // ← get real name from DB
            photo: dbUser?.photo?.url || '',
            rating: Number(rating),
            comment
        });

        // pre-save hook auto-recalculates avgRating + numReviews!
        await product.save();

        return NextResponse.json(
            { success: true, message: 'Review added!' },
            { status: 201 }
        );

    } catch (err) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}