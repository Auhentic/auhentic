'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function TopSellingSlider({ products }) {
    const total = products?.length || 0;
    const visibleCount = Math.min(3, total);

    const [startIndex, setStartIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const timerRef = useRef(null);

    // Detect screen width for mobile calculations
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const shouldLoop = isMobile ? total > 1 : total > visibleCount;

    // Duplicate products to create a smooth "infinite conveyor belt" effect
    const extendedProducts = shouldLoop
        ? [...products, ...products, ...products]
        : products;

    // Adjust middle starting offset if looping to allow scrolling in both directions smoothly
    const offsetIndex = shouldLoop ? startIndex + total : startIndex;

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

    const handleTransitionEnd = () => {
        if (!shouldLoop) return;

        // When reaching the end of the real items array, snap back instantly to the first set
        if (startIndex >= total) {
            setIsTransitioning(false);
            setStartIndex(0);
        }
    };

    // Re-enable transition smoothly after the reset tick settles down
    useEffect(() => {
        if (!isTransitioning && startIndex === 0) {
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsTransitioning(true);
                });
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [isTransitioning, startIndex]);

    if (!products || total === 0) return null;

    return (
        <div
            className="w-full h-auto lg:h-full flex flex-col overflow-hidden [--items-per-view:1] sm:[--items-per-view:var(--visible-count)]"
            style={{ '--visible-count': visibleCount }}
        >
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
            <div className="w-full flex-1 lg:min-h-0 overflow-hidden">
                {/* Conveyor Belt Track */}
                <div
                    onTransitionEnd={handleTransitionEnd}
                    className={`flex h-auto lg:h-full ${total === 1 ? 'sm:justify-center' : ''}`}
                    // className={`flex gap-3 h-auto lg:h-full ${total === 1 ? 'sm:justify-center' : ''}`}
                    style={{
                        transform: (total === 1 || !shouldLoop) ? 'none' : `translateX(calc(-${offsetIndex} * (100% / var(--items-per-view))))`,
                        transition: isTransitioning ? 'transform 800ms ease-in-out' : 'none',
                    }}
                >
                    {extendedProducts.map((product, i) => {
                        return (
                            // <div
                            //     key={`${product._id}-slide-${i}`}
                            //     style={{
                            //         flex: total === 1
                            //             ? 'var(--flex-single-item)'
                            //             : `0 0 calc((100% / var(--items-per-view)) - (3 - 1) * 4px)`
                            //     }}
                            //     className="h-auto lg:h-full [--flex-single-item:0_0_calc(100%-8px)] sm:[--flex-single-item:0_0_calc(50%-6px)]"
                            // >
                            <div
                                key={`${product._id}-slide-${i}`}
                                style={{
                                    flex: total === 1
                                        ? 'var(--flex-single-item)'
                                        : `0 0 calc(100% / var(--items-per-view))`
                                }}
                                className={`h-auto lg:h-full box-border [--flex-single-item:0_0_calc(100%-8px)] sm:[--flex-single-item:0_0_calc(50%-6px)] ${total !== 1 ? 'pr-3' : ''}`}
                            >
                                <Link
                                    href={`/products/${product._id}`}
                                    className="relative w-full h-auto lg:h-full rounded-3xl overflow-hidden flex flex-col items-center justify-center group bg-transparent hover:scale-[1.01] transition duration-200"
                                >
                                    <div className="relative w-full aspect-square lg:aspect-auto lg:flex-1 lg:min-h-0 bg-transparent overflow-hidden rounded-3xl">
                                        {product.images?.[0]?.url ? (
                                            <Image
                                                src={product.images[0].url}
                                                alt={product.name}
                                                fill
                                                priority
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white/10" />
                                        )}
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