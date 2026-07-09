'use client';

import Image from 'next/image';
import Link from 'next/link';

// Horizontal strip of offer products. Parent controls height (20% spec).
export default function OfferStrip({ products }) {
    if (!products || products.length === 0) return null;

    return (
        <div className="flex gap-4 h-full overflow-x-auto scrollbar-hide">
            {products.map((product) => {
                const discountedPrice = Math.round(
                    product.price * (1 - product.offer.discountPercent / 100)
                );

                return (
                    <Link
                        key={product._id}
                        href={`/products/${product._id}`}
                        className="relative flex-shrink-0 h-full aspect-[2/1] rounded-3xl overflow-hidden glass group"
                    >
                        {product.images?.[0]?.url ? (
                            <Image
                                src={product.images[0].url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-300"
                            />
                        ) : (
                            <div className="w-full h-full bg-black/10" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            {product.offer.discountPercent}% OFF
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-white font-semibold text-sm line-clamp-1 mb-0.5">
                                {product.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">
                                    ৳{discountedPrice.toLocaleString()}
                                </span>
                                <span className="text-white/60 text-xs line-through">
                                    ৳{product.price.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
