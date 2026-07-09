// src/app/api/products/[id]/route.js

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v2 as cloudinary } from 'cloudinary';

// ----------------------------------------
// GET /api/products/[id]
// Public — get single product with reviews
// ----------------------------------------
export async function GET(request, { params }) {
    try {
        await connectDB();

        const { id } = await params;

        const product = await Product.findById(id).populate(
            'reviews.user',
            'name'
        );

        if (!product) {
            return NextResponse.json(
                { message: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { product },
            { status: 200 }
        );
    }
    catch (error) {
        console.error('GET /api/products/[id] error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ----------------------------------------
// PATCH /api/products/[id]
// Admin only — update product fields
// ----------------------------------------
export async function PATCH(request, { params }) {
    try {
        // Verify admin
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = verifyToken(token);

        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        await connectDB();

        const { id } = await params;
        const body = await request.json();

        // Prevent reviews/rating from being manually patched
        delete body.reviews;
        delete body.avgRating;
        delete body.numReviews;

        // build flat dot-notation update for nested offer field
        const updateData = { ...body };

        // if offer is in body, flatten it to dot notation
        // so MongoDB merges instead of replaces
        if (body.offer) {
            delete updateData.offer;
            Object.keys(body.offer).forEach((key) => {
                updateData[`offer.${key}`] = body.offer[key];
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!product) {
            return NextResponse.json(
                { message: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Product updated', product },
            { status: 200 }
        );
    }
    catch (error) {
        console.error('PATCH /api/products/[id] error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ----------------------------------------
// DELETE /api/products/[id]
// Admin only — delete product + Cloudinary images
// ----------------------------------------
export async function DELETE(request, { params }) {
    try {
        // Verify admin
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = verifyToken(token);

        if (user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Forbidden' },
                { status: 403 }
            );
        }

        await connectDB();

        const { id } = await params;

        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json(
                { message: 'Product not found' },
                { status: 404 }
            );
        }

        // Delete all images from Cloudinary
        if (product.images?.length) {
            await Promise.all(
                product.images.map((img) =>
                    cloudinary.uploader.destroy(img.publicId)
                )
            );
        }

        await product.deleteOne();

        return NextResponse.json(
            { message: 'Product deleted' },
            { status: 200 }
        );
    }
    catch (error) {
        console.error('DELETE /api/products/[id] error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}