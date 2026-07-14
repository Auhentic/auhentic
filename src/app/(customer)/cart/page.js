'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OfferCountdown from '@/components/OfferCountdown';

export default function CartPage() {
    const [cart, setCart] = useState([]);
    const [selected, setSelected] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [personalOffer, setPersonalOffer] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    // const [couponPhone, setCouponPhone] = useState('');
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(stored);
        // default: all items selected
        const initSelected = {};
        stored.forEach((item) => {
            initSelected[`${item.productId}-${item.variant}`] = true;
        });
        setSelected(initSelected);
        // Sync to DB on page load too — not just on interaction
        if (stored.length > 0) {
            fetch('/api/auth/me')
                .then((r) => {
                    if (r.ok) {
                        syncCartToDB(stored);
                    }
                })
                .catch(() => { });
        }
        // Fetch personal offer for logged-in users
        fetch('/api/cart')
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => {
                const offer = res?.data?.personalOffer;
                // A personal offer with no expiresAt means "no time limit" —
                // it should still show up. Only hide it if it's inactive or
                // has an expiry that's already passed.
                const notExpired = !offer?.expiresAt || new Date(offer.expiresAt).getTime() > Date.now();
                if (offer?.active && notExpired) {
                    setPersonalOffer(offer);
                }
            })
            .catch(() => { });
    }, []);

    function loadCart() {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(stored);
    }

    // Sync cart to DB whenever it changes (logged-in users only)
    async function syncCartToDB(updatedCart) {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return; // guest — don't sync
            await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: updatedCart }),
            });
        } catch {
            // fail silently — localStorage is still the source of truth
        }
    }

    function updateQuantity(productId, variant, newQty) {
        if (newQty < 1) return;
        const updated = cart.map((item) =>
            item.productId === productId && item.variant === variant
                ? { ...item, quantity: newQty }
                : item
        );
        setCart(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('cartUpdated'));
        syncCartToDB(updated);
    }

    function removeItem(productId, variant) {
        const updated = cart.filter(
            (item) => !(item.productId === productId && item.variant === variant)
        );
        setCart(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('cartUpdated'));
        syncCartToDB(updated);
    }

    function toggleSelect(productId, variant) {
        const key = `${productId}-${variant}`;
        setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function clearCart() {
        setCart([]);
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));
        // Delete from DB too
        fetch('/api/cart', { method: 'DELETE' }).catch(() => { });
    }

    async function handleApplyCoupon() {
        setCouponError('');
        try {
            const res = await fetch('/api/coupons/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode }),
            });
            const data = await res.json();
            if (!data.valid) return setCouponError(data.message);

            setAppliedCoupon(data);
            localStorage.setItem('appliedCoupon', JSON.stringify(data));
        } catch {
            setCouponError('Something went wrong');
        }
    }

    // A personal (abandoned-cart) offer discounts whatever price is already
    // in the cart — it stacks on top of any general product offer that was
    // already baked into item.price when it was added to cart.
    function getEffectivePrice(item) {
        if (personalOffer?.discountPercent > 0) {
            return Math.round(item.price * (1 - personalOffer.discountPercent / 100));
        }
        return item.price;
    }

    const selectedCount = cart.filter((item) => selected[`${item.productId}-${item.variant}`]).length;
    const total = cart.reduce(
        (sum, item) => selected[`${item.productId}-${item.variant}`] ? sum + getEffectivePrice(item) * item.quantity : sum,
        0
    );

    if (cart.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="glass p-12 rounded-3xl">
                    <p className="text-black/50 text-lg mb-6">Your cart is empty!</p>
                    <Link href="/" className="glass-btn-primary text-black rounded-md hover:rounded-xl px-8 py-3 w-auto inline-block">
                        Shop Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-black mb-8">Your Cart</h1>

            <div className="flex flex-col gap-4 mb-8">
                {cart.map((item) => (
                    <div
                        key={`${item.productId}-${item.variant}`}
                        className="glass p-4 rounded-3xl flex flex-col md:flex-row md:items-center gap-4"
                    >
                        {/* Select Checkbox */}
                        <label className="flex items-center justify-center shrink-0 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!selected[`${item.productId}-${item.variant}`]}
                                onChange={() => toggleSelect(item.productId, item.variant)}
                                className="peer sr-only"
                            />
                            <span className="w-6 h-6 rounded-full border-2 border-black/20 flex items-center justify-center peer-checked:bg-[#c8860a] peer-checked:border-[#c8860a] transition-colors">
                                {selected[`${item.productId}-${item.variant}`] && (
                                    <span className="text-white text-xs">✓</span>
                                )}
                            </span>
                        </label>
                        {/* Image */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 shrink-0">
                            {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-black/20 text-xs">
                                    No img
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <p className="text-black font-medium text-sm">{item.name}</p>
                            {item.variant && (
                                <span className="text-black/40 text-xs">{item.variant}</span>
                            )}
                            {personalOffer ? (
                                <p className="text-green-700 bg-green-500/10 inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1">
                                    🎁 {personalOffer.discountPercent}% OFF{personalOffer.message ? ` — ${personalOffer.message}` : ''}
                                </p>
                            ) : item.offer?.offerLabel ? (
                                <p className="text-red-500 text-xs font-medium mt-1">
                                    🏷️ {item.offer.offerLabel}
                                </p>
                            ) : null}
                            <p className="text-[#c8860a] text-sm font-bold">
                                {personalOffer?.discountPercent > 0 && (
                                    <span className="text-black/40 text-xs line-through mr-1">
                                        ৳{item.price.toLocaleString()}
                                    </span>
                                )}
                                ৳{getEffectivePrice(item).toLocaleString()}
                            </p>
                        </div>

                        {/* Offer Countdown — personal offer (cart-wide) takes
                            priority, otherwise fall back to this item's own
                            limited-time offer. Sits between the item info
                            and the quantity controls. */}
                        {(() => {
                            const expiresAt = personalOffer?.expiresAt || item.offer?.expiresAt || null;
                            if (!expiresAt) return null;
                            return (
                                <div className="shrink-0">
                                    <OfferCountdown expiresAt={expiresAt} />
                                </div>
                            );
                        })()}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                                className="glass-btn w-8 h-8 flex items-center justify-center text-black rounded-md hover:rounded-xl font-bold p-0"
                            >
                                −
                            </button>
                            <span className="text-black w-6 text-center text-sm">
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                                className="glass-btn w-8 h-8 flex items-center justify-center text-black rounded-md hover:rounded-xl font-bold p-0"
                            >
                                +
                            </button>
                        </div>

                        {/* Item Total */}
                        <p className="text-black font-bold text-sm w-20 text-right">
                            ৳{(getEffectivePrice(item) * item.quantity).toLocaleString()}
                        </p>

                        {/* Remove */}
                        <button
                            onClick={() => removeItem(item.productId, item.variant)}
                            className="text-red-600 hover:text-red-500 transition text-xs"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            {/* Coupon — one box for the whole cart, applies to a single eligible item */}
            <div className="glass p-4 rounded-3xl mb-4">
                {!appliedCoupon ? (
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Have a coupon code?"
                            className="glass-inputs rounded-full text-sm flex-1 w-[100%] sm:w-[50%]"
                        />
                        <button onClick={handleApplyCoupon} className="glass-btns px-4 py-2 text-sm w-[100%] sm:w-[50%] ">
                            Apply Coupon
                        </button>
                    </div>
                ) : (
                    <p className="text-green-600 text-sm">✅ Coupon {appliedCoupon.code} applied — {appliedCoupon.discountPercent}% off will be applied to 1 unit of the eligible item at checkout</p>
                )}
                {couponError && <p className="text-red-600 text-xs mt-1">{couponError}</p>}
            </div>

            {/* Cart Summary */}
            <div className="glass p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-black/50 text-sm">Total</p>
                    <p className="text-black text-2xl font-bold">
                        ৳{total.toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={clearCart}
                        className="glass-btn text-black rounded-md hover:rounded-xl px-6 py-2 w-auto text-sm"
                    >
                        Clear Cart
                    </button>
                    <button
                        onClick={() => {
                            const checkoutItems = cart
                                .filter((item) => selected[`${item.productId}-${item.variant}`])
                                .map((item) => ({ ...item, price: getEffectivePrice(item) }));
                            localStorage.setItem('checkoutCart', JSON.stringify(checkoutItems));
                            router.push('/checkout');
                        }}
                        disabled={selectedCount === 0}
                        className={`glass-btn-primary text-black rounded-md hover:rounded-xl px-6 py-2 w-auto text-sm text-center ${selectedCount === 0 ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                    >
                        Proceed to Checkout ({selectedCount})
                    </button>
                </div>
            </div>
        </div>
    );
}
