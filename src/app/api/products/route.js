// src/app/api/products/route.js

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { slugify } from '@/lib/slugify';

// ----------------------------------------
// GET /api/products
// Public — list all available products
// Query params: category, sort, page, limit
// ----------------------------------------
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const category = searchParams.get('category') || null;
        const offerOnly = searchParams.get('offer') === 'true';
        const topSellingOnly = searchParams.get('topSelling') === 'true';
        const search = (searchParams.get('search') || '').trim();
        const sort = searchParams.get('sort') || 'createdAt';
        const order = searchParams.get('order') === 'asc' ? 1 : -1;
        const page = parseInt(searchParams.get('page')) || 1;
        // searching should not be squeezed into the default 12-item page
        const limit = parseInt(searchParams.get('limit')) || (search ? 100 : 12);
        const skip = (page - 1) * limit;

        let sortOption = { createdAt: -1 }; // default newest first

        if (sort === 'top') {
            sortOption = { 'ratings.count': -1, 'ratings.average': -1 };
        } else if (sort === 'price') {
            sortOption = { price: order };
        } else if (sort === 'name') {
            sortOption = { name: order };
        } else {
            sortOption = { createdAt: order };
        }

        const filter = { isAvailable: true };
        if (category) filter.category = category;
        if (offerOnly) filter['offer.isOnOffer'] = true;
        if (topSellingOnly) filter.isTopSelling = true;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const [products, total] = await Promise.all(
            [
                Product.find(filter)
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limit)
                    .select('-reviews'),
                Product.countDocuments(filter),
            ]
        );

        return NextResponse.json(
            {
                products,
                pagination:
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
            { status: 200 }
        );
    }
    catch (error) {
        console.error('GET /api/products error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ----------------------------------------
// POST /api/products
// Admin only — create a new product
// Body: name, description, price, category,
//       images, stock, offer
// ----------------------------------------
export async function POST(request) {
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

        const body = await request.json();

        // 👇 ADDED 'offer' and 'isTopSelling' to the destructured body
        const { name, description, price, category, subCategory, reviewLink, images, stock, offer, isTopSelling, variants, deliveryRestriction } = body;

        if (!name || !description || !price || !category || !images?.length) {
            return NextResponse.json(
                { message: 'name, description, price, category and at least one image are required' },
                { status: 400 }
            );
        }

        const baseSlug = slugify(name);
        let slug = baseSlug;
        let counter = 1;
        while (await Product.findOne({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        const product = await Product.create(
            {
                name,
                description,
                price,
                category,
                subCategory: subCategory || '',
                images,
                stock: stock || 0,
                offer,
                isTopSelling: !!isTopSelling,
                variants: variants || [],
                deliveryRestriction: deliveryRestriction || { enabled: false, allowedDistricts: [] },
                slug,
            }
        );

        return NextResponse.json(
            { message: 'Product created', product },
            { status: 201 }
        );
    }
    catch (error) {
        console.error('POST /api/products error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}