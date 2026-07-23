'use client';

import Link from 'next/link';
import Image from 'next/image';
import { isOfferActive } from '@/lib/offerUtils';
import OfferCountdown from './OfferCountdown';
import { productHref } from '@/lib/slugify';

export default function ProductCard({ product }) {
    function addToCart() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cart.findIndex(
            (item) => item.productId === product._id
        );

        // Use discounted price if on offer
        const cartPrice = isOnOffer ? discountedPrice : product.price;

        // Carry the offer's label + expiry into the cart item so the cart
        // page can show the "Happy Hour" style badge and countdown without
        // needing a fresh product lookup.
        const cartOffer = isOnOffer
            ? { offerLabel: product.offer?.offerLabel || '', expiresAt: product.offer?.expiresAt || null }
            : null;

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += 1;
            cart[existingIndex].offer = cartOffer;
        } else {
            cart.push({
                productId: product._id,
                name: product.name,
                price: cartPrice,
                image: product.images?.[0]?.url || '',
                quantity: 1,
                offer: cartOffer,
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));

        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'AddToCart', {
                content_ids: [product._id],
                content_type: 'product',
                value: cartPrice,
                currency: 'BDT',
            });
        }
    }

    // calculate discounted price if on offer
    // calculate discounted price if on offer (and not expired)
    const isOnOffer = isOfferActive(product.offer) && product.offer?.discountPercent > 0;
    const discountedPrice = isOnOffer
        ? Math.round(product.price * (1 - product.offer.discountPercent / 100))
        : null;
    const isTimeLimited = isOnOffer && !!product.offer?.expiresAt;

    return (
        <div className="glass p-4 flex flex-col gap-3 hover:border-black/20 transition rounded-3xl relative">

            {/* Offer Badge */}
            {isOnOffer && (
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        {product.offer.discountPercent}% OFF
                    </div>
                    {isTimeLimited && (
                        <div className="bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-lg">
                            ⏰ Limited time
                        </div>
                    )}
                </div>
            )}

            {/* Product Image */}
            <Link href={productHref(product)}>
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black/5">
                    {product.images?.[0]?.url ? (
                        <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/30 text-sm">
                            No image
                        </div>
                    )}
                </div>
            </Link>

            {/* Product Info */}
            <div className="flex flex-col gap-1">
                <Link href={productHref(product)}>
                    <h3 className="text-black font-medium text-sm line-clamp-2 hover:text-[#c8860a] transition">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-black/50 text-xs line-clamp-1">
                    {product.category}
                </p>

                {/* Price — show discounted if on offer */}
                {isOnOffer ? (
                    <div className="flex items-center gap-2">
                        <p className="text-[#c8860a] font-bold text-base">
                            ৳{discountedPrice.toLocaleString()}
                        </p>
                        <p className="text-black/40 text-xs line-through">
                            ৳{product.price.toLocaleString()}
                        </p>
                    </div>
                ) : (
                    <p className="text-[#c8860a] font-bold text-base">
                        ৳{product.price.toLocaleString()}
                    </p>
                )}

                {/* Offer Label */}
                {isOnOffer && product.offer?.offerLabel && (
                    <p className="text-red-500 text-xs font-medium">
                        🏷️ {product.offer.offerLabel}
                    </p>
                )}

                {/* Limited Time Offer — live countdown */}
                {isTimeLimited && (
                    <OfferCountdown expiresAt={product.offer.expiresAt} />
                )}

                {/* Stock Status */}
                {product.stock === 0 ? (
                    <span className="text-red-500 text-xs">Out of stock</span>
                ) : product.stock <= 30 ? (
                    <span className="text-yellow-600 text-xs">
                        Only {product.stock} left!
                    </span>
                ) : (
                    <span className="text-[#3E2723] text-xs">In stock</span>
                )}
            </div>

            {/* Delivery Restriction Notice */}
            {/* Delivery Restriction Notice */}
            {product.deliveryRestriction?.enabled && product.deliveryRestriction?.allowedDistricts?.length > 0 && (
                <p className="text-black/50 text-xs line-clamp-1">
                    🚚 Delivered only on shown city: {product.deliveryRestriction.allowedDistricts.map((d) => d.district).join(', ')}
                </p>
            )}

            {/* Add to Cart Button */}
            <button
                onClick={addToCart}
                disabled={product.stock === 0}
                className={`mt-auto text-sm py-2 rounded-lg font-medium transition
          ${product.stock === 0
                        ? 'bg-black/5 text-black/30 cursor-not-allowed'
                        : 'glass-btn-primary'
                    }`}
            >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

        </div>
    );
}