'use client';

import { useState } from 'react';
import ProductScrollRow from '@/components/ProductScrollRow';

// Selectable category chips at the top, then one scrollable product row
// per category. If a chip is selected, only that category row is shown.
// "All" shows every category row.
export default function CategorySection({ categoryRows }) {
    const [selected, setSelected] = useState('All');

    if (!categoryRows || categoryRows.length === 0) return null;

    const categories = ['All', ...categoryRows.map((r) => r.name)];

    const visibleRows = selected === 'All'
        ? categoryRows
        : categoryRows.filter((r) => r.name === selected);

    return (
        <div>
            {/* Selectable Category Chips */}
            <div className="flex gap-2 flex-wrap mb-6">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelected(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition
                            ${selected === cat
                                ? 'bg-white text-[#3E2723] shadow'
                                : 'bg-white/40 text-[#3E2723] hover:bg-white/60'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* One scrollable row per visible category */}
            <div className="flex flex-col gap-8">
                {visibleRows.map((row) => (
                    <div key={row.name} className="h-auto">
                        <ProductScrollRow
                            title={row.name}
                            icon={row.icon}
                            seeAllHref={row.seeAllHref || `/products?category=${encodeURIComponent(row.name)}`}
                            seeAllLabel={`See all (${row.name})`}
                            products={row.products}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
