'use client';

import { useState } from 'react';
import ProductScrollRow from '@/components/ProductScrollRow';

// Selectable category chips at the top, then one scrollable product row
// per category. If a chip is selected, only that category row is shown.
// "All" shows every category row. When a single category is selected,
// a second row of sub-category chips appears (if that category has any),
// letting the user narrow further.
export default function CategorySection({ categoryRows }) {
    const [selected, setSelected] = useState('All');
    const [selectedSub, setSelectedSub] = useState('All');

    if (!categoryRows || categoryRows.length === 0) return null;

    const categories = ['All', ...categoryRows.map((r) => r.name)];

    function handleCategoryClick(cat) {
        setSelected(cat);
        setSelectedSub('All'); // reset sub-filter whenever main category changes
    }

    const visibleRows = selected === 'All'
        ? categoryRows
        : categoryRows.filter((r) => r.name === selected);

    // Sub-categories only make sense when exactly one category is selected
    const activeRow = selected !== 'All' ? categoryRows.find((r) => r.name === selected) : null;
    const subCategories = activeRow
        ? [...new Set(activeRow.products.map((p) => p.subCategory).filter(Boolean))]
        : [];

    // Apply the sub-category filter (if any) to each visible row's products
    const filteredRows = visibleRows.map((row) => ({
        ...row,
        products: selectedSub === 'All'
            ? row.products
            : row.products.filter((p) => p.subCategory === selectedSub),
    }));

    return (
        <div>
            {/* Selectable Category Chips */}
            <div className="flex gap-2 flex-nowrap overflow-x-auto scrollbar-hide mb-3 pb-1">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0
                            ${selected === cat
                                ? 'bg-white text-[#3E2723] shadow'
                                : 'bg-white/40 text-[#3E2723] hover:bg-white/60'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Sub-Category Chips — only when one category is selected and it has sub-categories */}
            {subCategories.length > 0 && (
                <div className="flex gap-2 flex-nowrap overflow-x-auto scrollbar-hide mb-6 pb-1">
                    {['All', ...subCategories].map((sub) => (
                        <button
                            key={sub}
                            onClick={() => setSelectedSub(sub)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition flex-shrink-0 border
                                ${selectedSub === sub
                                    ? 'bg-[#3E2723] text-white border-[#3E2723]'
                                    : 'bg-transparent text-[#3E2723]/70 border-[#3E2723]/20 hover:bg-white/40'
                                }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            )}

            {/* One scrollable row per visible category */}
            <div className="flex flex-col gap-8">
                {filteredRows.map((row) => (
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