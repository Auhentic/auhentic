'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-12 text-center text-black/40">Loading...</div>}>
            <ProductsPageInner />
        </Suspense>
    );
}

function ProductsPageInner() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';
    const offerOnly = searchParams.get('offer') === 'true';
    const limitedOnly = searchParams.get('limited') === 'true';

    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState(initialCategory);
    const [categories, setCategories] = useState([]);
    const [subCategory, setSubCategory] = useState('all');
    const navSearch = searchParams.get('search') || '';
    const [sortBy, setSortBy] = useState('none');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch(`/api/products?search=${encodeURIComponent(navSearch)}`);
                const data = await res.json();
                const prods = data.products || [];
                setProducts(prods);
                setFiltered(prods);

                // extract unique categories
                const cats = [...new Set(prods.map((p) => p.category))].filter(Boolean);
                setCategories(cats);
            } catch {
                // fail silently
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [navSearch]);

    useEffect(() => {
        let result = products;

        // filter by category
        if (category !== 'all') {
            result = result.filter((p) => p.category === category);
        }

        // filter by sub-category
        if (category !== 'all' && subCategory !== 'all') {
            result = result.filter((p) => (p.subCategory || '') === subCategory);
        }

        // filter by offer
        if (offerOnly) {
            result = result.filter((p) => p.offer?.isOnOffer && p.offer?.discountPercent > 0);
        }

        // filter by limited-time offer
        if (limitedOnly) {
            result = result.filter(
                (p) => p.offer?.isOnOffer && p.offer?.discountPercent > 0 &&
                    p.offer?.expiresAt && new Date(p.offer.expiresAt).getTime() > Date.now()
            );
        }

        // filter by search
        if (search.trim()) {
            result = result.filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // filter by price range
        if (minPrice !== '') {
            result = result.filter((p) => p.price >= Number(minPrice));
        }
        if (maxPrice !== '') {
            result = result.filter((p) => p.price <= Number(maxPrice));
        }

        // sort by price
        if (sortBy === 'lowToHigh') {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (sortBy === 'highToLow') {
            result = [...result].sort((a, b) => b.price - a.price);
        }

        setFiltered(result);
    }, [search, category, subCategory, products, offerOnly, limitedOnly, sortBy, minPrice, maxPrice]);

    // sub-categories available for whichever main category is currently selected
    const availableSubCategories = category === 'all'
        ? []
        : [...new Set(
            products
                .filter((p) => p.category === category && p.subCategory)
                .map((p) => p.subCategory)
        )];

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">

            {/* Header */}
            <h1 className="text-2xl font-bold text-black mb-8">All Products</h1>

            {/* Search + Filter Bar */}
            <div className="glass rounded-3xl p-4 mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="glass-input rounded-lg w-full"
                />

                {/* Combined Category & Subcategory Dropdown Wrapper */}
                <div className="grid grid-cols-2 gap-2 w-full">
                    <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setSubCategory('all'); }}
                        className="glass-input rounded-lg w-full text-xs sm:text-sm px-2"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        disabled={category === 'all' || availableSubCategories.length === 0}
                        className="glass-input rounded-lg w-full text-xs sm:text-sm px-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <option value="all">
                            {category === 'all' ? 'All Subcategories' : `All ${category}`}
                        </option>
                        {availableSubCategories.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>

                {/* Sort Filter */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="glass-input rounded-lg w-full"
                >
                    <option value="none">Sort: Default</option>
                    <option value="lowToHigh">Price: Low to High</option>
                    <option value="highToLow">Price: High to Low</option>
                </select>

                {/* Price range */}
                <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min ৳"
                    min={0}
                    className="glass-input rounded-lg w-full"
                />
                <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max ৳"
                    min={0}
                    className="glass-input rounded-lg w-full"
                />

                {/* Clear Button */}
                <button
                    onClick={() => {
                        setSearch('');
                        setCategory('all');
                        setSubCategory('all');
                        setSortBy('none');
                        setMinPrice('');
                        setMaxPrice('');
                    }}
                    disabled={!search && category === 'all' && subCategory === 'all' && sortBy === 'none' && !minPrice && !maxPrice}
                    className="glass-btn rounded-lg w-full py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Clear Filters
                </button>

            </div>

            {/* Results Count */}
            {!loading && (
                <p className="text-black/40 text-sm mb-4">
                    {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
                    {category !== 'all' && ` in "${category}"`}
                    {search && ` for "${search}"`}
                </p>
            )}

            {/* Products Grid */}
            {loading ? (
                <div className="glass rounded-3xl p-12 text-center text-black/50">
                    Loading products...
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center">
                    <p className="text-black/50 text-lg mb-2">No products found</p>
                    <p className="text-black/30 text-sm">
                        Try a different search or category
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}

        </div>
    );
}