import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { getAuthUser } from '@/lib/auth';

// GET — public, anyone can read settings
// Used by Footer, Contact page, Homepage
export async function GET() {
    try {
        await connectDB();

        // findOne or create default if doesn't exist yet
        let settings = await Settings.findOne({ key: 'site_settings' });

        if (!settings) {
            settings = await Settings.create({ key: 'site_settings' });
        }

        return NextResponse.json({ settings }, { status: 200 });
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT — admin only, update settings
export async function PUT(request) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // BUG FIX: Extract districtDelivery separately and strip any _id fields
        // that MongoDB may have attached from previous saves. Sending _id in a
        // subdoc array with $set can confuse Mongoose's strict mode and silently
        // drop the array or cause a cast error, making districts vanish on reload.
        const {
            districtDelivery: rawDistricts = [],
            ...otherFields
        } = body;

        // Strip _id from each district item before saving
        const cleanDistricts = rawDistricts.map(({ district, charge }) => ({
            district,
            charge: Number(charge) || 0,
        }));

        const settings = await Settings.findOneAndUpdate(
            { key: 'site_settings' },
            {
                $set: {
                    ...otherFields,
                    key: 'site_settings',
                    districtDelivery: cleanDistricts,
                },
            },
            { new: true, upsert: true, runValidators: true }
        );

        return NextResponse.json(
            { message: 'Settings updated successfully', settings },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
