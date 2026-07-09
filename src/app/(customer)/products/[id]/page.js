'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
// after: import Image from 'next/image';
import { isOfferActive } from '@/lib/offerUtils';

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
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
    }, [id]);

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
        router.push('/cart');
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
                            if (product.images?.[activeImage]?.url) {
                                setLightboxImage(product.images[activeImage].url);
                                setLightbox(true);
                            }
                        }}
                    >
                        {product.images?.[activeImage]?.url ? (
                            <>
                                <Image
                                    src={product.images[activeImage].url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
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
                                    onClick={() => setActiveImage(index)}
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
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
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
                            🚚 Delivers only to: {product.deliveryRestriction.allowedDistricts.map((d) => d.district).join(', ')}
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
                                        onClick={() => setSelectedVariant(v)}
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

                    {/* Add to Cart */}
                    <button
                        onClick={addToCart}
                        disabled={product.stock === 0}
                        className={`py-3 rounded-xl font-bold text-base transition mt-2
              ${product.stock === 0
                                ? 'bg-black/5 text-black/30 cursor-not-allowed'
                                : 'glass-btn-primary'
                            }`}
                    >
                        {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>

                    {/* Free Shipping Note */}
                    {typeof settings?.freeDeliveryAmount === 'number' && settings.freeDeliveryAmount > 0 && (
                        <p className="text-black/40 text-xs">
                            🚚 {settings.freeDeliveryText || `Free delivery on orders over ৳${settings.freeDeliveryAmount.toLocaleString()}`}
                        </p>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className="glass p-6 rounded-3xl">
                <h2 className="text-black font-bold text-xl mb-6">
                    Reviews{' '}
                    {product.reviews?.length > 0 && (
                        <span className="text-black/40 text-base font-normal rounded-3xl">
                            ({product.reviews.length})
                        </span>
                    )}
                </h2>

                {/* Write Review — only for logged in + delivered */}
                {user && hasDelivered && (
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
                )}

                {/* Not delivered yet message */}
                {user && !hasDelivered && (
                    <div className="glass p-4 mb-6 text-black/40 text-sm text-center rounded-3xl">
                        You can write a review after your order is delivered
                    </div>
                )}

                {/* Login to review */}
                {!user && (
                    <div className="glass p-4 mb-6 text-center">
                        <p className="text-black/40 text-sm">
                            Please{' '}
                            <a href="/auth/login" className="text-[#c8860a] hover:underline">
                                login
                            </a>{' '}
                            to write a review
                        </p>
                    </div>
                )}

                {/* Reviews List */}
                {product.reviews?.length === 0 ? (
                    <p className="text-black/30 text-sm text-center py-4">
                        No reviews yet. Be the first to review!
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {product.reviews.map((review, index) => (
                            <div key={index} className="glass p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-black font-medium text-sm">
                                            {review.name}
                                        </p>
                                        <div className="flex gap-0.5 mt-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`text-sm
                            ${star <= review.rating
                                                            ? 'text-yellow-400'
                                                            : 'text-black/20'
                                                        }`}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-black/30 text-xs">
                                        {new Date(review.createdAt).toLocaleDateString('en-BD', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <p className="text-black/60 text-sm">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Lightbox UI placed at the bottom of return block */}
            {lightbox && (
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
            )}

        </div>
    );
}