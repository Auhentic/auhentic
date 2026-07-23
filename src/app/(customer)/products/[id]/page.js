'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { isOfferActive } from '@/lib/offerUtils';

export default function ProductDetailPage() {
    const params = useParams();
    // URL can be a bare Mongo ID, or "<id>-product-name-slug" (pretty permalink).
    // Always pull just the leading 24-char ObjectId back out before using it.
    // const id = params.id?.match(/^[a-f0-9]{24}/i)?.[0] || params.id;
    const id = params.id;
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [manualImageOverride, setManualImageOverride] = useState(null); // set when user explicitly clicks a basic thumbnail
    const [user, setUser] = useState(null);
    const [hasDelivered, setHasDelivered] = useState(false);
    const [settings, setSettings] = useState(null);

    // Lightbox State
    const [lightbox, setLightbox] = useState(false);
    const [lightboxImage, setLightboxImage] = useState('');

    // Review form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');

    useEffect(() => {
        fetchProduct();
        fetchUser();
        fetch('/api/track', {
            method: 'POST',
            body: JSON.stringify({ type: 'product_view', productId: id, path: `/products/${id}` }),
        }).catch(() => { });

        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'ViewContent', {
                content_ids: [id],
                content_type: 'product',
                value: product?.price || 0,       // add
                currency: 'BDT',                  // add
            });
        }
    }, [id]);

    // If the link came with #reviews (e.g. from an admin "review link" share), jump straight there
    useEffect(() => {
        if (window.location.hash === '#reviews' && !loading) {
            document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [loading]);

    useEffect(() => {
        async function loadSettings() {
            const s = await fetchSettings();
            setSettings(s);
        }
        loadSettings();
    }, []);

    async function fetchProduct() {
        try {
            const res = await fetch(`/api/products/${id}`);
            if (!res.ok) throw new Error('Product not found');
            const data = await res.json();
            setProduct(data.product || data);
        } catch {
            setError('Product not found');
        } finally {
            setLoading(false);
        }
    }

    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) return null;
            const data = await res.json();
            return data.settings;
        } catch {
            return null;
        }
    }

    async function fetchUser() {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return;
            const data = await res.json();
            setUser(data.user);

            // check if user has a delivered order with this product
            const ordersRes = await fetch('/api/orders');
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                const orders = ordersData.data || [];
                const delivered = orders.some(
                    (order) =>
                        order.orderStatus === 'delivered' &&
                        order.items.some((item) =>
                            item.productId?.toString() === id ||
                            item.productId?._id?.toString() === id ||
                            item.product?.toString() === id
                        )
                );
                setHasDelivered(delivered);
            }
        } catch {
            // guest user
        }
    }

    function addToCart() {
        if (!product || product.stock === 0) return;

        // Use discounted price if on offer
        const isOnOffer = isOfferActive(product.offer) && product.offer?.discountPercent > 0;
        const basePrice = selectedVariant ? selectedVariant.price : product.price;
        const cartPrice = isOnOffer
            ? Math.round(basePrice * (1 - product.offer.discountPercent / 100))
            : basePrice;

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cart.findIndex(
            (item) => item.productId === product._id && item.variant === (selectedVariant?.label || null)
        );

        // Carry the offer's label + expiry into the cart item so the cart
        // page can show the offer badge and countdown without a fresh lookup.
        const cartOffer = isOnOffer
            ? { offerLabel: product.offer?.offerLabel || '', expiresAt: product.offer?.expiresAt || null }
            : null;

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += quantity;
            cart[existingIndex].offer = cartOffer;
        } else {
            cart.push({
                productId: product._id,
                name: product.name,
                price: cartPrice,
                image: product.images?.[0]?.url || '',
                quantity,
                variant: selectedVariant?.label || null,
                offer: cartOffer,
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));

        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'AddToCart', {
                content_ids: [product._id],
                content_type: 'product',
                value: cartPrice * quantity,
                currency: 'BDT',
            });
        }
    }

    function buyNow() {
        if (!product || product.stock === 0) return;

        const isOnOffer = isOfferActive(product.offer) && product.offer?.discountPercent > 0;
        const basePrice = selectedVariant ? selectedVariant.price : product.price;
        const cartPrice = isOnOffer
            ? Math.round(basePrice * (1 - product.offer.discountPercent / 100))
            : basePrice;

        const cartOffer = isOnOffer
            ? { offerLabel: product.offer?.offerLabel || '', expiresAt: product.offer?.expiresAt || null }
            : null;

        const buyNowItem = [{
            productId: product._id,
            name: product.name,
            price: cartPrice,
            image: product.images?.[0]?.url || '',
            quantity,
            variant: selectedVariant?.label || null,
            offer: cartOffer,
        }];

        localStorage.setItem('checkoutCart', JSON.stringify(buyNowItem));

        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'InitiateCheckout', {
                content_ids: [product._id],
                content_type: 'product',
                value: cartPrice * quantity,
                currency: 'BDT',
            });
        }

        router.push('/checkout');
    }

    async function handleReviewSubmit() {
        setReviewError('');
        setReviewSuccess('');

        if (!comment.trim()) {
            return setReviewError('Please write a comment');
        }

        setReviewLoading(true);

        try {
            const res = await fetch(`/api/products/${id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment }),
            });

            const data = await res.json();
            if (!res.ok) return setReviewError(data.message);

            setReviewSuccess('Review submitted successfully!');
            setComment('');
            setRating(5);
            fetchProduct(); // refresh to show new review
        } catch {
            setReviewError('Something went wrong');
        } finally {
            setReviewLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-20 text-center">
                <div className="glass p-12 text-black/50">Loading product...</div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-20 text-center">
                <div className="glass p-12 text-black/50">{error || 'Product not found'}</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">

            {/* Product Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

                {/* Images */}
                <div className="flex flex-col gap-3">
                    {/* Main Image Container updated with Lightbox Trigger */}
                    <div
                        className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/5 cursor-zoom-in"
                        onClick={() => {
                            const url = manualImageOverride || selectedVariant?.image?.url || product.images?.[activeImage]?.url;
                            if (url) {
                                setLightboxImage(url);
                                setLightbox(true);
                            }
                        }}
                    >
                        {(manualImageOverride || selectedVariant?.image?.url || product.images?.[activeImage]?.url) ? (
                            <>
                                <Image
                                    src={manualImageOverride || selectedVariant?.image?.url || product.images[activeImage].url}
                                    alt={selectedVariant ? `${product.name} - ${selectedVariant.label}` : product.name}
                                    fill
                                    className="object-contain"
                                />
                                <div className="absolute bottom-2 right-2 glass rounded-lg px-2 py-1 text-xs text-black/60 z-10">
                                    🔍 Click to enlarge
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-black/20">
                                No image
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {product.images?.length > 1 && (
                        <div className="flex gap-2">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => { setActiveImage(index); setManualImageOverride(img.url); }}
                                    className={`relative w-16 h-16 rounded-lg overflow-hidden bg-black/5 border-2 transition
                                        ${activeImage === index
                                            ? 'border-blue-400'
                                            : 'border-transparent hover:border-black/30'
                                        }`}
                                >
                                    <Image
                                        src={img.url}
                                        alt={`${product.name} ${index + 1}`}
                                        fill
                                        className="object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Social Media Review Card placed under the product photo */}
                    {product.reviewLink && (
                        <a
                            href={product.reviewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:bg-white/60 transition shadow-xs group border border-black/5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-1.5 shrink-0">
                                    {/* Facebook Icon */}
                                    <div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center ring-2 ring-white">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </div>
                                    {/* Instagram Icon */}
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center ring-2 ring-white">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-black/80 group-hover:text-black">
                                    See customer reviews on Facebook & Instagram
                                </span>
                            </div>
                            <span className="text-black/40 group-hover:translate-x-1 transition-transform text-sm font-bold">
                                →
                            </span>
                        </a>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col gap-4">
                    {/* Category */}
                    <span className="text-blue-400 text-sm font-medium">
                        {product.category}
                    </span>

                    {/* Name */}
                    <h1 className="text-2xl md:text-3xl font-bold text-black">
                        {product.name}
                    </h1>

                    {/* Ratings */}
                    {product.numReviews > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={star <= Math.round(product.avgRating)
                                            ? 'text-yellow-400'
                                            : 'text-black/20'
                                        }
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-black/50 text-sm">
                                {product.avgRating?.toFixed(1)} ({product.numReviews} reviews)
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    {(() => {
                        const basePrice = selectedVariant ? selectedVariant.price : product.price;
                        const isOnOffer = isOfferActive(product.offer) && product.offer?.discountPercent > 0;
                        const finalPrice = isOnOffer
                            ? Math.round(basePrice * (1 - product.offer.discountPercent / 100))
                            : basePrice;
                        return isOnOffer ? (
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-bold text-black">
                                    ৳{finalPrice.toLocaleString()}
                                </span>
                                <span className="text-xl text-gray-700 line-through">
                                    ৳{basePrice.toLocaleString()}
                                </span>
                            </div>
                        ) : (
                            <span className="text-4xl font-bold text-black">
                                ৳{finalPrice.toLocaleString()}
                            </span>
                        );
                    })()}

                    {/* Stock */}
                    {product.stock === 0 ? (
                        <span className="text-red-600 text-sm font-medium">
                            Out of stock
                        </span>
                    ) : product.stock <= 30 ? (
                        <span className="text-yellow-600 text-sm font-medium">
                            ⚠️ Only {product.stock} left!
                        </span>
                    ) : (
                        <span className="text-green-600 text-sm font-medium">
                            ✅ In stock ({product.stock} available)
                        </span>
                    )}

                    {/* Delivery Restriction Notice */}
                    {product.deliveryRestriction?.enabled && product.deliveryRestriction?.allowedDistricts?.length > 0 && (
                        <p className="text-black/60 text-sm">
                            🚚 Delivered only on shown city: {product.deliveryRestriction.allowedDistricts.map((d) => d.district).join(', ')}
                        </p>
                    )}

                    {/* Description */}
                    <p className="text-black/60 text-sm leading-relaxed">
                        {product.description}
                    </p>

                    {/* Variant Selector */}
                    {product.variants?.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-black/70 text-sm">Select Quantity:</span>
                            <div className="flex gap-2 flex-wrap">
                                {product.variants.map((v, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setSelectedVariant(v); setManualImageOverride(null); }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition
                                            ${selectedVariant?.label === v.label
                                                ? 'bg-black text-white border-black'
                                                : 'glass border-black/20 text-black hover:border-black/40'
                                            }`}
                                    >
                                        {v.label}
                                        <span className="ml-1.5 opacity-70">৳{v.price.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity Selector */}
                    {product.stock > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-black/70 text-sm">Quantity:</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="glass-btn w-8 h-8 flex items-center justify-center font-bold p-0"
                                >
                                    −
                                </button>
                                <span className="text-black w-8 text-center">{quantity}</span>
                                <button
                                    onClick={() =>
                                        setQuantity(Math.min(product.stock, quantity + 1))
                                    }
                                    className="glass-btn w-8 h-8 flex items-center justify-center font-bold p-0"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add to Cart / Order Options — 2x2 grid with authentic social colors & icons */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {settings?.phone && (
                            <a href={`tel:${settings.phone}`}
                                className="glass-btn py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-black hover:bg-black/5"
                            >
                                <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                </svg>
                                Order by Call
                            </a>
                        )}

                        {settings?.whatsapp && (
                            <a href={`https://wa.me/88${settings.whatsapp}?text=${encodeURIComponent(`Hi, I want to order: ${product.name}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-btn py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 border border-[#25D366]/30"
                            >
                                <svg className="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                </svg>
                                Order by WhatsApp
                            </a>
                        )}

                        {settings?.facebook && (
                            <a href={settings.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-btn py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border border-[#1877F2]/30"
                            >
                                <svg className="w-4 h-4 fill-current text-[#1877F2]" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Order via Facebook
                            </a>
                        )}

                        {settings?.instagram && (
                            <a href={settings.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-btn py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 border border-[#E1306C]/30"
                            >
                                <svg className="w-4 h-4 fill-current text-[#E1306C]" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                                Order via Instagram
                            </a>
                        )}

                        <button
                            onClick={addToCart}
                            disabled={product.stock === 0}
                            className={`py-3 rounded-xl font-bold text-sm transition ${product.stock === 0 ? 'bg-black/5 text-black/30 cursor-not-allowed' : 'glass-btn-primary'}`}
                        >
                            {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                        </button>

                        <button
                            onClick={buyNow}
                            disabled={product.stock === 0}
                            className={`py-3 rounded-xl font-bold text-sm transition
            ${product.stock === 0
                                    ? 'bg-black/5 text-black/30 cursor-not-allowed'
                                    : 'glass-btn-primary'
                                }`}
                        >
                            {product.stock === 0 ? 'Out of Stock' : '⚡ Buy Now'}
                        </button>
                    </div>

                    {/* Free Shipping Note */}
                    {typeof settings?.freeDeliveryAmount === 'number' && settings.freeDeliveryAmount > 0 && (
                        <p className="text-black/40 text-xs">
                            🚚 {settings.freeDeliveryText || `Free delivery on orders over ৳${settings.freeDeliveryAmount.toLocaleString()}`}
                        </p>
                    )}
                </div>
            </div >

            {/* Reviews Section */}
            <div id="reviews" className="glass p-6 rounded-3xl">
                <h2 className="text-black font-bold text-xl mb-6">
                    Reviews{' '}
                    {product.reviews?.length > 0 && (
                        <span className="text-black/40 text-base font-normal rounded-3xl">
                            ({product.reviews.length})
                        </span>
                    )}
                </h2>

                {/* Write Review — only for logged in + delivered */}
                {
                    user && hasDelivered && (
                        <div className="glass p-4 mb-6 rounded-3xl">
                            <h3 className="text-black font-semibold mb-3 text-sm">
                                Write a Review
                            </h3>

                            {/* Star Rating */}
                            <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition
                                        ${star <= rating ? 'text-yellow-400' : 'text-black/20'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience with this product..."
                                rows={3}
                                className="glass-input resize-none mb-3"
                            />

                            {reviewError && (
                                <p className="text-[#3E2723] text-xs mb-2">{reviewError}</p>
                            )}
                            {reviewSuccess && (
                                <p className="text-[#3E2723] text-xs mb-2">{reviewSuccess}</p>
                            )}

                            <button
                                onClick={handleReviewSubmit}
                                disabled={reviewLoading}
                                className="glass-btn-primary px-6 py-2 w-auto text-sm"
                            >
                                {reviewLoading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    )
                }

                {/* Not delivered yet message */}
                {
                    user && !hasDelivered && (
                        <div className="glass p-4 mb-6 text-black/40 text-sm text-center rounded-3xl">
                            You can write a review after your order is delivered
                        </div>
                    )
                }

                {/* Login to review */}
                {
                    !user && (
                        <div className="glass p-4 mb-6 text-center">
                            <p className="text-black/40 text-sm">
                                Please{' '}
                                <a href="/auth/login" className="text-[#c8860a] hover:underline">
                                    login
                                </a>{' '}
                                to write a review
                            </p>
                        </div>
                    )
                }

                {/* Reviews List */}
                {
                    product.reviews?.length === 0 ? (
                        <p className="text-black/30 text-sm text-center py-4">
                            No reviews yet. Be the first to review!
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {product.reviews.map((review, index) => (
                                <div key={index} className="glass p-4 rounded-2xl">
                                    <div className="flex items-start justify-between mb-2 gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-black/10 shrink-0 border border-black/10">
                                                {review.photo ? (
                                                    <Image src={review.photo} alt={review.name} fill className="object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-black/40 text-xs font-semibold">
                                                        {review.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-black font-medium text-sm truncate">
                                                    {review.name}
                                                </p>
                                                <div className="flex gap-0.5 mt-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span
                                                            key={star}
                                                            className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-black/20'}`}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-black/30 text-xs shrink-0">
                                            {new Date(review.createdAt).toLocaleDateString('en-BD', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <p className="text-black/60 text-sm text-left mt-1">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div >

            {/* Fullscreen Lightbox UI placed at the bottom of return block */}
            {
                lightbox && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setLightbox(false)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white text-3xl hover:text-white/70 transition"
                            onClick={() => setLightbox(false)}
                        >
                            ✕
                        </button>
                        <div className="relative max-w-3xl w-full aspect-square">
                            <Image
                                src={lightboxImage}
                                alt="Full view"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <p className="absolute bottom-4 text-white/40 text-sm">
                            Click anywhere to close
                        </p>
                    </div>
                )
            }

        </div >
    );
}