'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isOfferActive } from '@/lib/offerUtils';

const BD_DISTRICTS = [
    'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria',
    'Chandpur', 'Chapai Nawabganj', 'Chattogram', 'Chuadanga', "Cox's Bazar", 'Cumilla',
    'Dhaka', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj',
    'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat',
    'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur',
    'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar',
    'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi',
    'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh',
    'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur',
    'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet',
    'Tangail', 'Thakurgaon',
];

export default function CheckoutPage() {
    const router = useRouter();
    const districtRef = useRef(null);  // ← move this to TOP, before all useState
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState(null);
    const [personalOffer, setPersonalOffer] = useState(null);
    const [productDetails, setProductDetails] = useState([]);
    const [districtSearch, setDistrictSearch] = useState('');
    const [districtOpen, setDistrictOpen] = useState(false);
    const [itemNotes, setItemNotes] = useState({});

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        district: '',
        postalCode: '',
        paymentMethod: 'COD', // Forces default value to COD
    });

    useEffect(() => {
        // load cart
        const stored = JSON.parse(localStorage.getItem('checkoutCart') || localStorage.getItem('cart') || '[]');
        if (stored.length === 0) {
            router.push('/cart');
            return;
        }
        setCart(stored);

        // load user if logged in
        async function fetchUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    // pre-fill form with user info
                    setForm((prev) => ({
                        ...prev,
                        name: data.user.name || '',
                        email: data.user.email || '',
                        phone: data.user.phone || '',
                    }));
                }
            } catch {
                // guest user
            }
        }

        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data.settings);
                }
            } catch {
                // use defaults
            }
        }

        async function fetchPersonalOffer() {
            try {
                const res = await fetch('/api/cart');
                if (!res.ok) return;
                const data = await res.json();
                const offer = data?.data?.personalOffer;
                const notExpired = !offer?.expiresAt || new Date(offer.expiresAt).getTime() > Date.now();
                if (offer?.active && notExpired) setPersonalOffer(offer);
            } catch {
                // guest or no offer
            }
        }

        fetchUser();
        fetchSettings();
        fetchPersonalOffer()

        // Fetch full product details for cart items to get delivery restrictions
        async function fetchProductDetails(cartItems) {
            try {
                const details = await Promise.all(
                    cartItems.map((item) =>
                        fetch(`/api/products/${item.productId}`)
                            .then((r) => r.ok ? r.json() : null)
                            .then((d) => d?.product || null)
                            .catch(() => null)
                    )
                );
                setProductDetails(details.filter(Boolean));
            } catch {
                // non-critical, fall back to all districts
            }
        }

        fetchProductDetails(stored);

        // Close district dropdown on outside click
        function handleClickOutside(e) {
            if (districtRef.current && !districtRef.current.contains(e.target)) {
                setDistrictOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [router]);

    function itemKey(item) {
        return `${item.productId}-${item.variant || 'default'}`;
    }

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    }

    function getLivePrice(item) {
        const product = productDetails.find((p) => p._id === (item._id || item.productId));
        if (!product) return item.price;
        let price = item.variant
            ? (product.variants?.find((v) => v.label === item.variant)?.price ?? product.price)
            : product.price;
        if (isOfferActive(product.offer) && product.offer?.discountPercent > 0) {
            price = Math.round(price * (1 - product.offer.discountPercent / 100));
        }
        if (personalOffer?.discountPercent > 0) {
            price = Math.round(price * (1 - personalOffer.discountPercent / 100));
        }
        return price;
    }

    const subtotal = cart.reduce((sum, item) => sum + getLivePrice(item) * item.quantity, 0);


    // Compute allowed districts based on product restrictions in cart.
    // If any product has deliveryRestriction.enabled with districts,
    // intersect all restricted products' district lists.
    // Products without restriction don't narrow the list.
    const restrictedProducts = productDetails.filter(
        (p) => p?.deliveryRestriction?.enabled && p?.deliveryRestriction?.allowedDistricts?.length > 0
    );

    let allowedDistrictsForCart = null; // null = no restriction = show all
    if (restrictedProducts.length > 0) {
        // Start with first restricted product's districts
        let intersection = restrictedProducts[0].deliveryRestriction.allowedDistricts.map((d) => d.district);
        // Intersect with each subsequent restricted product
        for (let i = 1; i < restrictedProducts.length; i++) {
            const next = restrictedProducts[i].deliveryRestriction.allowedDistricts.map((d) => d.district);
            intersection = intersection.filter((d) => next.includes(d));
        }
        allowedDistrictsForCart = intersection;
    }

    // Get the delivery charge for selected district — check product restriction first, then global settings
    function getDistrictCharge(district) {
        // Check if any restricted product has a custom charge for this district
        for (const p of restrictedProducts) {
            const entry = p.deliveryRestriction.allowedDistricts.find(
                (d) => d.district.toLowerCase() === district.toLowerCase()
            );
            if (entry !== undefined) return entry.charge;
        }
        // Fall back to global settings
        const entry = settings?.districtDelivery?.find(
            (d) => d.district.toLowerCase() === district.trim().toLowerCase()
        );
        return entry !== undefined ? entry.charge : 80;
    }

    const districtCharge = form.district ? getDistrictCharge(form.district) : 80;
    const hasFreeDeliveryThreshold = typeof settings?.freeDeliveryAmount === 'number' && settings.freeDeliveryAmount > 0;
    const shippingCost = hasFreeDeliveryThreshold && subtotal >= settings.freeDeliveryAmount ? 0 : districtCharge;
    const total = subtotal + shippingCost;

    async function handlePlaceOrder() {
        setError('');

        const { name, email, phone, street, city, district, paymentMethod } = form;

        if (!name || !email || !phone || !street || !city || !district) {
            return setError('Please fill in all required fields');
        }

        // Just an extra failsafe protection rule
        if (paymentMethod !== 'COD') {
            return setError('Only Cash on Delivery is currently available.');
        }

        setLoading(true);

        try {
            const orderPayload = {
                items: cart.map((item) => ({
                    productId: item._id || item.productId,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    variant: item.variant || null,
                    note: itemNotes[itemKey(item)]?.trim() || '',
                })),
                shippingAddress: {
                    street: form.street,
                    city: form.city,
                    district: form.district,
                    postalCode: form.postalCode,
                    phone: form.phone,
                },
                paymentMethod,
                subtotal: subtotal,
                shippingCost: shippingCost,
                total: total,
                ...(!user && {
                    guestInfo: { name, email, phone },
                }),
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });

            const data = await res.json();

            if (!res.ok) return setError(data.message);

            // clear cart from localStorage and DB
            // remove only the checked-out items from the full cart, keep the rest waiting
            const fullCart = JSON.parse(localStorage.getItem('cart') || '[]');
            const remaining = fullCart.filter(
                (item) => !cart.some((c) => c.productId === item.productId && c.variant === item.variant)
            );
            localStorage.setItem('cart', JSON.stringify(remaining));
            localStorage.removeItem('checkoutCart');
            window.dispatchEvent(new Event('cartUpdated'));
            fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: remaining }) }).catch(() => { });

            // redirect to order confirmation
            if (typeof window !== 'undefined' && window.fbq) {
                window.fbq('track', 'Purchase', {
                    value: total,
                    currency: 'BDT',
                });
            }

            router.push(`/orders/${data.data._id}?success=true${!user ? `&phone=${encodeURIComponent(form.phone)}` : ''}`);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 text-black">
            <h1 className="text-2xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left — Shipping Form & Payment Method */}
                <div className="flex flex-col gap-6">
                    <div className="glass p-6 rounded-3xl">
                        <h2 className="font-semibold mb-4 text-black">Delivery Information</h2>
                        <div className="flex flex-col gap-4">

                            <div>
                                <label className="text-black/70 text-sm mb-1 block">Full Name *</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    className="glass-input w-full p-3 border border-black/10 rounded-3xl focus:outline-none focus:border-black/30"
                                />
                            </div>

                            <div>
                                <label className="text-black/70 text-sm mb-1 block">Email *</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    className="glass-input w-full p-3 border border-black/10 rounded-3xl focus:outline-none focus:border-black/30"
                                />
                            </div>

                            <div>
                                <label className="text-black/70 text-sm mb-1 block">Phone *</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="01XXXXXXXXX"
                                    className="glass-input w-full p-3 border border-black/10 rounded-3xl focus:outline-none focus:border-black/30"
                                />
                            </div>

                            <div>
                                <label className="text-black/70 text-sm mb-1 block">Street Address *</label>
                                <input
                                    name="street"
                                    value={form.street}
                                    onChange={handleChange}
                                    placeholder="House, Road, Area"
                                    className="glass-input w-full p-3 border border-black/10 rounded-3xl focus:outline-none focus:border-black/30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-black/70 text-sm mb-1 block">City *</label>
                                    <input
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="Dhaka"
                                        className="glass-input w-full p-3 border border-black/10 rounded-3xl focus:outline-none focus:border-black/30"
                                    />
                                </div>
                                <div ref={districtRef} className="relative">
                                    <label className="text-black/70 text-sm mb-1 block">District *</label>
                                    {/* Searchable district picker */}
                                    <div
                                        className="glass-input w-full p-3 border border-black/10 rounded-3xl focus-within:border-black/30 cursor-pointer flex items-center justify-between gap-2"
                                        onClick={() => setDistrictOpen(true)}
                                    >
                                        {form.district ? (
                                            <span className="text-black text-sm">{form.district}</span>
                                        ) : (
                                            <span className="text-black/40 text-sm">Select district...</span>
                                        )}
                                        <span className="text-black/30 text-xs">{districtOpen ? '▲' : '▼'}</span>
                                    </div>

                                    {districtOpen && (
                                        <div className="absolute z-50 top-full mt-1 left-0 right-0 glass rounded-2xl border border-black/10 shadow-lg overflow-hidden">
                                            {/* Search box */}
                                            <div className="p-2 border-b border-black/10">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={districtSearch}
                                                    onChange={(e) => setDistrictSearch(e.target.value)}
                                                    placeholder="Search district..."
                                                    className="w-full px-3 py-1.5 text-sm rounded-xl bg-black/5 text-black placeholder:text-black/30 outline-none"
                                                />
                                            </div>
                                            {/* District list — filtered by product restrictions if any */}
                                            <div className="max-h-44 overflow-y-auto">
                                                {allowedDistrictsForCart && (
                                                    <p className="text-xs text-orange-600/70 px-4 py-1.5 bg-orange-50/50 border-b border-black/5">
                                                        ⚠️ Delivery restricted to {allowedDistrictsForCart.length} district{allowedDistrictsForCart.length !== 1 ? 's' : ''} for items in your cart
                                                    </p>
                                                )}
                                                {(allowedDistrictsForCart || BD_DISTRICTS)
                                                    .filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase()))
                                                    .map((d) => {
                                                        const charge = getDistrictCharge(d);
                                                        return (
                                                            <div
                                                                key={d}
                                                                onClick={() => {
                                                                    setForm((prev) => ({ ...prev, district: d }));
                                                                    setDistrictSearch('');
                                                                    setDistrictOpen(false);
                                                                }}
                                                                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-black/5 transition
                                                                    ${form.district === d ? 'bg-black/10 font-semibold text-black' : 'text-black/70'}`}
                                                            >
                                                                <span>{d}</span>
                                                                <span className="text-xs text-black/40">
                                                                    {charge === 0 ? 'Free' : `৳${charge}`}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                }
                                                {(allowedDistrictsForCart || BD_DISTRICTS).filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase())).length === 0 && (
                                                    <p className="text-center text-black/30 text-sm py-4">No district found</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-black/70 text-sm mb-1 block">
                                    Postal Code (optional)
                                </label>
                                <input
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={handleChange}
                                    placeholder="1207"
                                    className="glass-input w-full p-3 border border-black/10 rounded-3xl focus:outline-none focus:border-black/30"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Payment Method Section */}
                    <div className="glass p-6 rounded-3xl">
                        <h2 className="font-semibold mb-4 text-black">Payment Method</h2>
                        <div className="flex flex-col gap-3">

                            {/* COD Option — Selected & Allowed */}
                            <label className="flex items-center gap-3 glass p-3 rounded-3xl cursor-pointer border border-black/20 hover:border-black/40 bg-black/5 transition">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={form.paymentMethod === 'COD'}
                                    onChange={handleChange}
                                    className="accent-black w-4 h-4"
                                />
                                <span className="text-black font-medium text-sm">💵 Cash on Delivery (COD)</span>
                            </label>

                            {/* Disabled Payment Methods */}
                            {[
                                { value: 'sslcommerz', label: '💳 SSL Commerz (Card/Net Banking)' },
                                { value: 'bkash', label: 'bKash' },
                                { value: 'nagad', label: 'Nagad' },
                                { value: 'rocket', label: 'Rocket' },
                            ].map((method) => (
                                <label
                                    key={method.value}
                                    className="flex items-center gap-3 glass p-3 rounded-3xl opacity-40 cursor-not-allowed pointer-events-none select-none bg-black/5 border border-transparent"
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method.value}
                                        checked={false}
                                        disabled
                                        className="accent-gray-400 w-4 h-4"
                                    />
                                    <span className="text-black/60 text-sm">{method.label}</span>
                                    <span className="text-black/40 text-xs ml-auto font-medium">Unavailable</span>
                                </label>
                            ))}

                        </div>
                    </div>
                </div>

                {/* Right — Order Summary Card */}
                <div className="flex flex-col gap-4">
                    <div className="glass p-6 rounded-3xl">
                        <h2 className="font-semibold mb-4 text-black">Order Summary</h2>
                        <div className="flex flex-col gap-3">
                            {cart.map((item) => (
                                <div key={`${item.productId}-${item.variant || 'default'}-${item.quantity}`} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-black/70">
                                            {item.name}{item.variant ? ` (${item.variant})` : ''}{' '}
                                            <span className="text-black/40">x{item.quantity}</span>
                                        </span>
                                        <span className="text-black font-medium">
                                            ৳{(item.price * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={itemNotes[itemKey(item)] || ''}
                                        onChange={(e) =>
                                            setItemNotes((prev) => ({ ...prev, [itemKey(item)]: e.target.value }))
                                        }
                                        placeholder={`Special request for ${item.name} (optional) — e.g. "extra mayo" or "write Happy Birthday"`}
                                        maxLength={300}
                                        className="glass-input text-xs py-1.5 px-3 rounded-full w-full"
                                    />
                                </div>
                            ))}

                            <div className="border-t border-black/10 pt-3 flex justify-between">
                                <span className="text-black/50 text-sm">Subtotal</span>
                                <span className="text-black font-medium">
                                    ৳{subtotal.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-black/50 text-sm">Delivery</span>
                                {shippingCost === 0 ? (
                                    <span className="text-green-600 text-sm font-medium">Free</span>
                                ) : (
                                    <span className="text-black text-sm font-medium">৳{shippingCost}</span>
                                )}
                            </div>

                            <div className="border-t border-black/10 pt-3 flex justify-between">
                                <span className="text-black font-bold">Total</span>
                                <span className="text-black font-bold text-lg">
                                    ৳{total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-3xl bg-red-100 border border-red-300 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="glass-btn-primary py-4 text-base font-bold text-black border border-black/20 rounded-3xl transition hover:bg-black/10"
                    >
                        {loading ? 'Placing Order...' : 'Place Order'}
                    </button>
                </div>

            </div>
        </div>
    );
}