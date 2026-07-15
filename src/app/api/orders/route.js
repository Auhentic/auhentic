import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Cart from '@/models/Cart';
import { getAuthUser } from '@/lib/auth';
import { isOfferActive } from '@/lib/offerUtils';
import Settings from '@/models/Settings';
import Counter from '@/models/Counter';
import Coupon from '@/models/Coupon';
import User from '@/models/User';

// GET all orders
// Admin → sees ALL orders
// Customer → sees only THEIR orders
export async function GET(request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { message: 'Login required!' },
                { status: 401 }
            );
        }

        await connectDB();

        const filter = user.role === 'admin'
            ? {}                    // admin sees everything
            : { user: user.id };    // customer sees only theirs

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .populate('user', 'name email');

        return NextResponse.json(
            { success: true, data: orders },
            { status: 200 }
        );

    } catch (err) {
        return NextResponse.json(
            { message: err.message },
            { status: 500 }
        );
    }
}

// POST place a new order
// Works for both logged-in users AND guests (COD)

export async function POST(request) {
    try {
        await connectDB();

        const user = await getAuthUser(); // null if guest
        const body = await request.json();

        const {
            items,
            shippingAddress,
            paymentMethod,
            guestInfo,
            note
        } = body;

        // Validate required fields
        if (!items?.length || !shippingAddress || !paymentMethod) {
            return NextResponse.json(
                { message: 'Items, shipping address and payment method are required!' },
                { status: 400 }
            );
        }

        // Guest must provide guestInfo for COD
        if (!user && paymentMethod !== 'COD') {
            return NextResponse.json(
                { message: 'Please login for online payment!' },
                { status: 401 }
            );
        }

        if (!user && !guestInfo?.name) {
            return NextResponse.json(
                { message: 'Please provide your name and phone for COD!' },
                { status: 400 }
            );
        }

        // Personal (abandoned-cart) offer, if the user has an active one —
        // this stacks on top of each item's own general offer, same as the
        // cart page does.
        let personalOffer = null;
        if (user) {
            const userCart = await Cart.findOne({ user: user.id });
            const po = userCart?.personalOffer;
            const notExpired = !po?.expiresAt || new Date(po.expiresAt).getTime() > Date.now();
            if (po?.active && notExpired && po.discountPercent > 0) {
                personalOffer = po;
            }
        }

        // Verify products exist + calculate totals
        let subtotal = 0;
        const orderItems = [];
        // Track the most specific delivery charge dictated by any
        // item-level delivery restriction for the chosen district.
        let restrictedCharge = null;

        let coupon = null;
        let couponOrderPhone = null; // needed again later when "burning" an all-customer coupon
        if (body.couponCode) {
            coupon = await Coupon.findOne({ code: body.couponCode.trim().toUpperCase(), active: true, usedInOrder: null });
            if (coupon) {
                // getAuthUser() only decodes the JWT (id + role) — it does NOT
                // carry phone/email, so we need the real profile to check identity.
                const dbUser = user ? await User.findById(user.id).select('phone email') : null;
                const orderPhone = dbUser?.phone || shippingAddress.phone;
                const orderEmail = (dbUser?.email || guestInfo?.email)?.toLowerCase();
                couponOrderPhone = orderPhone;
                const matches =
                    coupon.targetAll ||
                    (coupon.targetPhone && coupon.targetPhone === orderPhone) ||
                    (coupon.targetEmail && coupon.targetEmail === orderEmail);
                if (!matches) coupon = null;
                if (coupon && coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) coupon = null;
                // All-customer coupon — this phone already redeemed it once
                if (coupon && coupon.targetAll && orderPhone && coupon.usedByPhones?.includes(orderPhone)) coupon = null;
            }
        }
        // A coupon is good for exactly ONE unit of ONE eligible item —
        // not every matching item, and not every unit of that item.
        let couponConsumed = false;

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product || !product.isAvailable) {
                return NextResponse.json(
                    { message: `Product not available: ${item.productId}` },
                    { status: 400 }
                );
            }

            if (product.stock < item.quantity) {
                return NextResponse.json(
                    { message: `Not enough stock for ${product.name}!` },
                    { status: 400 }
                );
            }

            // Enforce item-level delivery restriction — reject orders to
            // districts the product isn't allowed to ship to.
            if (product.deliveryRestriction?.enabled && product.deliveryRestriction?.allowedDistricts?.length > 0) {
                const entry = product.deliveryRestriction.allowedDistricts.find(
                    (d) => d.district.toLowerCase() === shippingAddress.district?.toLowerCase()
                );
                if (!entry) {
                    return NextResponse.json(
                        { message: `${product.name} does not deliver to ${shippingAddress.district}.` },
                        { status: 400 }
                    );
                }
                // Item-level charge takes priority over global district pricing.
                if (restrictedCharge === null) restrictedCharge = entry.charge;
            }

            // Work out the real price server-side — never trust the price
            // sent from the client. Apply the product's own active offer,
            // then stack the personal offer on top, same as the cart UI.
            let price = item.variant
                ? (product.variants?.find((v) => v.label === item.variant)?.price ?? product.price)
                : product.price;
            if (isOfferActive(product.offer) && product.offer?.discountPercent > 0) {
                price = Math.round(price * (1 - product.offer.discountPercent / 100));
            }
            if (personalOffer) {
                price = Math.round(price * (1 - personalOffer.discountPercent / 100));
            }

            // Coupon — applies to exactly ONE unit of the first eligible
            // item, no matter how many matching items/units are in the cart.
            let lineTotal = price * item.quantity;
            if (coupon && !couponConsumed) {
                const matchesProduct = coupon.scope === 'product' && coupon.targetProduct?.toString() === product._id.toString();
                const matchesCategory = coupon.scope === 'category' && product.category === coupon.targetCategory;
                const matchesAll = coupon.scope === 'all';
                if (matchesProduct || matchesCategory || matchesAll) {
                    const discountedUnitPrice = Math.round(price * (1 - coupon.discountPercent / 100));
                    lineTotal = discountedUnitPrice + price * (item.quantity - 1);
                    couponConsumed = true;
                }
            }

            // Snapshot price/name/image at time of order!
            orderItems.push({
                productId: product._id,
                name: product.name,
                image: product.images[0]?.url || '',
                price,
                quantity: item.quantity,
                variant: item.variant || null,
                note: typeof item.note === 'string' ? item.note.trim().slice(0, 300) : '',
            });

            subtotal += lineTotal;
        }

        // Shipping cost logic — item-level delivery restriction charge wins
        // over the global district charge (matches checkout page logic).
        const settings = await Settings.findOne({ key: 'site_settings' });
        const globalCharge = settings?.districtDelivery?.find(
            (d) => d.district === shippingAddress.district
        )?.charge ?? 80; // default 80 if district not found

        const districtCharge = restrictedCharge !== null ? restrictedCharge : globalCharge;

        // apply free delivery if above threshold
        const hasFreeDeliveryThreshold = typeof settings?.freeDeliveryAmount === 'number' && settings.freeDeliveryAmount > 0;
        const shippingCost = hasFreeDeliveryThreshold && subtotal >= settings.freeDeliveryAmount ? 0 : districtCharge;
        const total = subtotal + shippingCost;

        // Generate next order number atomically (AUH-630, AUH-631...)
        const counter = await Counter.findOneAndUpdate(
            { name: 'orderNumber' },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
        );
        const orderNumber = counter.value;

        // Create order
        const order = await Order.create({
            user: user?.id || null,
            guestInfo: !user ? guestInfo : undefined,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            shippingCost,
            total,
            note,
            orderNumber,
            couponCode: coupon && couponConsumed ? coupon.code : null,
        });

        // Burn the coupon now that we have a real order id — one-time use only.
        // Burn the coupon now that we have a real order id.
        // Personal coupons (one customer) are one-time use — delete entirely.
        // "All customer" coupons stay alive but remember this phone used it,
        // so this same person can't reuse it while everyone else still can.
        if (coupon && couponConsumed) {
            if (coupon.targetAll) {
                await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedByPhones: couponOrderPhone } });
            } else {
                await Coupon.findByIdAndDelete(coupon._id);
            }
        }

        // Reduce stock for each product
        for (const item of items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
            );
        }

        return NextResponse.json(
            { success: true, data: order },
            { status: 201 }
        );

    } catch (err) {
        return NextResponse.json(
            { message: err.message },
            { status: 500 }
        );
    }
}