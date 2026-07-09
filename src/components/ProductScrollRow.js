'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OfferCountdown from './OfferCountdown';
import { isOfferActive } from '@/lib/offerUtils';

// Naturo-style horizontal product row: title + "See all" inline at top
// with nav arrows, then a scrollable row of clickable product cards.
// Each card is purely a link to the product detail page — no separate
// view/cart icon buttons, since users should see reviews/images first.
export default function ProductScrollRow({ title, icon, seeAllHref, seeAllLabel, products }) {
    const scrollRef = useRef(null);
    const timerRef = useRef(null);
    const isHoveredRef = useRef(false);

    // Auto-slide — nudge the row forward every few seconds, looping back
    // to the start once it reaches the end. Pauses while the user is
    // hovering so they can browse without the row moving under them.
    useEffect(() => {
        if (!products || products.length <= 2) return;

        timerRef.current = setInterval(() => {
            if (isHoveredRef.current) return;
            const el = scrollRef.current;
            if (!el) return;
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
            el.scrollTo({
                left: atEnd ? 0 : el.scrollLeft + 220,
                behavior: 'smooth',
            });
        }, 3000);

        return () => clearInterval(timerRef.current);
    }, [products]);

    function scrollByAmount(amount) {
        scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
    }

    if (!products || products.length === 0) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Header row — title, See all, arrows */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-[#3E2723] font-bold text-lg flex items-center gap-1.5">
                        {icon} {title}
                    </h2>
                    {seeAllHref && (
                        <Link
                            href={seeAllHref}
                            className="text-[#3E2723]/70 text-sm hover:text-[#3E2723] hover:underline flex items-center gap-1"
                        >
                            {seeAllLabel || 'View more'} <span>›</span>
                        </Link>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => scrollByAmount(-260)}
                        aria-label="Scroll left"
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-[#3E2723] flex items-center justify-center transition"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => scrollByAmount(260)}
                        aria-label="Scroll right"
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-[#3E2723] flex items-center justify-center transition"
                    >
                        ›
                    </button>
                </div>
            </div>

            {/* Scrollable card row */}
            <div
                ref={scrollRef}
                onMouseEnter={() => (isHoveredRef.current = true)}
                onMouseLeave={() => (isHoveredRef.current = false)}
                className="flex-1 min-h-0 flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
            >
                {products.map((product) => {
                    const isOnOffer = isOfferActive(product.offer) && product.offer?.discountPercent > 0;
                    const discountedPrice = isOnOffer
                        ? Math.round(product.price * (1 - product.offer.discountPercent / 100))
                        : null;

                    return (
                        <Link
                            key={product._id}
                            href={`/products/${product._id}`}
                            className="flex-shrink-0 w-36 sm:w-44 h-full bg-[#3E2723]/60 rounded-2xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition"
                        >
                            {/* Image */}
                            <div className="relative w-full flex-[3] min-h-0 bg-black/5">
                                {product.images?.[0]?.url ? (
                                    <Image
                                        src={product.images[0].url}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#3E2723]/30 text-xs">
                                        No image
                                    </div>
                                )}
                                {isOnOffer && (
                                    <div className="absolute top-1.5 left-1.5 bg-red-500 text-[#3E2723] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {product.offer.discountPercent}% OFF
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-2.5 flex flex-col gap-0.5 flex-shrink-0">
                                <h3 className="text-[#3E2723] text-xs font-medium line-clamp-2 leading-tight">
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {isOnOffer ? (
                                        <>
                                            <span className="text-[#E8B86D] font-bold text-sm">
                                                ৳{discountedPrice.toLocaleString()}
                                            </span>
                                            <span className="text-[#3E2723]/40 text-xs line-through">
                                                ৳{product.price.toLocaleString()}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[#E8B86D] font-bold text-sm">
                                            ৳{product.price.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                {isOnOffer && product.offer?.expiresAt && (
                                    <OfferCountdown expiresAt={product.offer.expiresAt} />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
