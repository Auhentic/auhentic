'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function TopSellingSlider({ products }) {
    const total = products?.length || 0;
    const visibleCount = Math.min(3, total);

    const [startIndex, setStartIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const timerRef = useRef(null);

    // 1. Create the circular loop array by appending the first few items to the end
    // e.g., [1, 2, 3, 4] becomes [1, 2, 3, 4, 1, 2, 3]
    const shouldLoop = total > visibleCount;
    const extendedProducts = shouldLoop
        ? [...products, ...products.slice(0, visibleCount)]
        : products;

    useEffect(() => {
        if (!shouldLoop) return;

        timerRef.current = setInterval(() => {
            setStartIndex((prev) => prev + 1);
        }, 3500); // Adjust speed here (3.5 seconds per slide)

        return () => clearInterval(timerRef.current);
    }, [shouldLoop]);

    // 2. Handle the seamless reset trick
    const handleTransitionEnd = () => {
        if (startIndex >= total) {
            // Instantly jump back to the real index 0 without the user seeing a transition
            setIsTransitioning(false);
            setStartIndex(0);
        }
    };

    // 3. Turn the transition back on right after jumping back
    useEffect(() => {
        if (!isTransitioning && startIndex === 0) {
            // A brief micro-task delay allows the browser to process the instant jump
            setTimeout(() => {
                setIsTransitioning(true);
            }, 50);
        }
    }, [isTransitioning, startIndex]);

    if (!products || total === 0) return null;

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                <h2 className="text-[#3E2723] font-bold text-base">🔥 Top Selling Product</h2>
                {shouldLoop && (
                    <div className="flex gap-1.5">
                        {products.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setIsTransitioning(true);
                                    setStartIndex(i);
                                }}
                                aria-label={`Go to product ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300
                                    ${i === (startIndex % total) ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Viewport Window */}
            <div className="flex-1 min-h-0 w-full overflow-hidden">
                {/* Conveyor Belt Track */}
                <div
                    onTransitionEnd={handleTransitionEnd}
                    className="flex h-full gap-3"
                    style={{
                        transform: `translateX(-${startIndex * (100 / visibleCount)}%)`,
                        transition: isTransitioning ? 'transform 800ms ease-in-out' : 'none',
                    }}
                >
                    {extendedProducts.map((product, i) => {
                        const isOnOffer = product.offer?.isOnOffer && product.offer?.discountPercent > 0;
                        const discountedPrice = isOnOffer
                            ? Math.round(product.price * (1 - product.offer.discountPercent / 100))
                            : null;

                        return (
                            <div
                                // Dynamic key prevents React from conflicting on cloned elements
                                key={`${product._id}-slide-${i}`}
                                style={{ flex: `0 0 calc(${100 / visibleCount}% - ${(3 - 1) * 4}px)` }}
                                className="h-full"
                            >
                                <Link
                                    href={`/products/${product._id}`}
                                    className="relative h-full w-full rounded-2xl overflow-hidden flex flex-col group glass hover:scale-[1.01] transition duration-200"
                                >
                                    {/* Image */}
                                    <div className="relative flex-[3] min-h-0 w-full">
                                        {product.images?.[0]?.url ? (
                                            <Image
                                                src={product.images[0].url}
                                                alt={product.name}
                                                fill
                                                priority
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/10" />
                                        )}
                                        {isOnOffer && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {product.offer.discountPercent}% OFF
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-[2] min-h-0 p-2.5 flex flex-col gap-0.5 bg-[#3E2723]/60 backdrop-blur-sm">
                                        <h3 className="text-white font-semibold text-xs line-clamp-1">{product.name}</h3>
                                        <p className="text-white/60 text-[10px]">{product.category}</p>
                                        <div className="flex items-center gap-1.5">
                                            {isOnOffer ? (
                                                <>
                                                    <span className="text-white font-bold text-xs">৳{discountedPrice.toLocaleString()}</span>
                                                    <span className="text-white/50 text-[10px] line-through">৳{product.price.toLocaleString()}</span>
                                                </>
                                            ) : (
                                                <span className="text-white font-bold text-xs">৳{product.price.toLocaleString()}</span>
                                            )}
                                        </div>
                                        {isOnOffer && product.offer?.offerLabel && (
                                            <p className="text-yellow-300 text-[10px] line-clamp-1">🏷 {product.offer.offerLabel}</p>
                                        )}
                                        <p className="text-white/60 text-[10px]">Qty: {product.stock}</p>
                                        <p className="text-white/50 text-[10px] line-clamp-1">{product.description}</p>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}