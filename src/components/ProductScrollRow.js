'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OfferCountdown from './OfferCountdown';
import { isOfferActive } from '@/lib/offerUtils';

export default function ProductScrollRow({ title, icon, seeAllHref, seeAllLabel, products }) {
    const total = products?.length || 0;

    // Desktop shows 7 items based on layout requirements
    const visibleCount = Math.min(7, total);

    const [startIndex, setStartIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const timerRef = useRef(null);

    // Detect if screen is mobile/tablet to safely loop items on smaller viewports
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const shouldLoop = isMobile ? total > 2 : total > visibleCount;

    const extendedProducts = shouldLoop
        ? [...products, ...products.slice(0, isMobile ? 2 : visibleCount)]
        : products;

    useEffect(() => {
        if (!shouldLoop) {
            setStartIndex(0);
            return;
        }

        timerRef.current = setInterval(() => {
            setStartIndex((prev) => prev + 1);
        }, 3500);

        return () => clearInterval(timerRef.current);
    }, [shouldLoop]);

    const handleTransitionEnd = (e) => {
        if (e.target !== e.currentTarget) return;

        if (startIndex >= total) {
            setIsTransitioning(false);
            setStartIndex(0);
        }
    };

    useEffect(() => {
        if (!isTransitioning && startIndex === 0) {
            const raf = requestAnimationFrame(() => {
                setTimeout(() => {
                    setIsTransitioning(true);
                }, 30);
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [isTransitioning, startIndex]);

    function scrollByAmount(direction) {
        if (!shouldLoop) return;
        setIsTransitioning(true);
        if (direction === '-full') {
            setStartIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
        } else {
            setStartIndex((prev) => prev + 1);
        }
    }

    if (!products || total === 0) return null;

    return (
        <div
            className="flex flex-col h-auto overflow-hidden [--items-per-view:2] md:[--items-per-view:7]"
            style={{ '--visible-count': visibleCount }}
        >
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

                {shouldLoop && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => scrollByAmount('-full')}
                            aria-label="Scroll left"
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-[#3E2723] flex items-center justify-center transition"
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => scrollByAmount('full')}
                            aria-label="Scroll right"
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-[#3E2723] flex items-center justify-center transition"
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            {/* Viewport Window */}
            <div className="w-full h-auto overflow-hidden">
                {/* Conveyor Belt Track */}
                <div
                    onTransitionEnd={handleTransitionEnd}
                    className="flex gap-3 h-auto"
                    style={{
                        // FIXED: Corrected translation math to move exactly 1 item width + 1 gap step
                        transform: (total === 1 || !shouldLoop)
                            ? 'none'
                            : `translateX(calc(-${startIndex} * (100% + 12px) / var(--items-per-view)))`,
                        transition: isTransitioning ? 'transform 800ms ease-in-out' : 'none',
                    }}
                >
                    {extendedProducts.map((product, i) => {
                        const isOnOffer = isOfferActive(product.offer) && product.offer?.discountPercent > 0;
                        const discountedPrice = isOnOffer
                            ? Math.round(product.price * (1 - product.offer.discountPercent / 100))
                            : null;

                        return (
                            <Link
                                key={`${product._id}-slide-${i}`}
                                href={`/products/${product._id}`}
                                style={{
                                    // FIXED: Keeps item width precisely responsive to the gap value
                                    flex: `0 0 calc(100% / var(--items-per-view) - (12px * (var(--items-per-view) - 1) / var(--items-per-view)))`
                                }}
                                className="flex-shrink-0 h-auto bg-[#3E2723]/60 rounded-2xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition"
                            >
                                {/* Image */}
                                <div className="relative w-full aspect-square bg-black/5">
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
        </div>
    );
}