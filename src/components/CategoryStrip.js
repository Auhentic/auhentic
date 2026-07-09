'use client';

import Image from 'next/image';
import Link from 'next/link';

// Horizontal strip of category tiles. Each tile ~20% width per spec,
// uses the first product's image found in that category as the thumbnail.
export default function CategoryStrip({ categories }) {
    if (!categories || categories.length === 0) return null;

    return (
        <div className="flex gap-4 h-full overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
                <Link
                    key={cat.name}
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="relative flex-shrink-0 w-[45%] sm:w-[30%] md:w-[20%] h-full rounded-3xl overflow-hidden glass group"
                >
                    {cat.image ? (
                        <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                        />
                    ) : (
                        <div className="w-full h-full bg-black/10" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold text-sm line-clamp-1 mb-0.5">
                            {cat.name}
                        </h3>
                        <span className="text-white/70 text-xs group-hover:text-white group-hover:underline">
                            See all ({cat.name}) →
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}
