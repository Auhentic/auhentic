'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import DateTimePicker from '@/components/admin/DateTimePicker';

const BD_DISTRICTS = [
    'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria',
    'Chandpur', 'Chapai Nawabganj', 'Chattogram', 'Chuadanga', "Cox's Bazar", 'Cumilla',
    'Dhaka', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj',
    'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat',
    'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur',
    'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar',
    'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi',
    'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh',
    'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur',
    'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet',
    'Tangail', 'Thakurgaon',
];

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    // existingImages = images already saved in DB (edit mode)
    const [existingImages, setExistingImages] = useState([]);
    const fileRef = useRef();
    const [search, setSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('all'); // all | low | high
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [topSellingOnly, setTopSellingOnly] = useState(false);

    const emptyForm = {
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        isOnOffer: false,
        discountPercent: '',
        offerLabel: '',
        isTopSelling: false,
        variants: [],
        restrictDelivery: false,
        allowedDistricts: [],
        offer: { expiresAt: '' },
    };
    const categories = ['all', ...new Set(products.map((p) => p.category).filter(Boolean))];

    const [form, setForm] = useState(emptyForm);
    const [variantLabel, setVariantLabel] = useState('');
    const [variantPrice, setVariantPrice] = useState('');
    const [restrictDistrictInput, setRestrictDistrictInput] = useState('');
    const [restrictChargeInput, setRestrictChargeInput] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data.products || []);
        } catch {
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        setError('');
    }

    function addVariant() {
        const label = variantLabel.trim();
        const price = Number(variantPrice);
        if (!label || !price) return;
        setForm((prev) => ({ ...prev, variants: [...prev.variants, { label, price }] }));
        setVariantLabel('');
        setVariantPrice('');
    }

    function removeVariant(index) {
        setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
    }

    function addRestrictedDistrict() {
        const district = restrictDistrictInput.trim();
        const charge = Number(restrictChargeInput) || 0;
        if (!district) return;
        if (form.allowedDistricts.find((d) => d.district === district)) return;
        setForm((prev) => ({ ...prev, allowedDistricts: [...prev.allowedDistricts, { district, charge }] }));
        setRestrictDistrictInput('');
        setRestrictChargeInput('');
    }

    function removeRestrictedDistrict(district) {
        setForm((prev) => ({
            ...prev,
            allowedDistricts: prev.allowedDistricts.filter((d) => d.district !== district),
        }));
    }

    function openAddForm() {
        setForm(emptyForm);
        setEditProduct(null);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setError('');
        setSuccess('');
        setShowForm(true);
    }

    function openEditForm(product) {
        setForm({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            isOnOffer: product.offer?.isOnOffer || false,
            discountPercent: product.offer?.discountPercent || '',
            offerLabel: product.offer?.offerLabel || '',
            isTopSelling: product.isTopSelling || false,
            variants: product.variants || [],
            restrictDelivery: product.deliveryRestriction?.enabled || false,
            allowedDistricts: product.deliveryRestriction?.allowedDistricts || [],
            offer: {
                expiresAt: product.offer?.expiresAt
                    ? new Date(product.offer.expiresAt).toISOString()
                    : '',
            },
        });
        setEditProduct(product);
        // Store existing DB images separately
        setExistingImages(product.images || []);
        setImageFiles([]);
        setImagePreviews([]);
        setError('');
        setSuccess('');
        setShowForm(true);
    }

    function removeExistingImage(index) {
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
    }

    function handleFileChange(e) {
        // Slots left = 3 minus existing DB images minus new files already queued
        const totalAllowed = 3 - existingImages.length - imageFiles.length;
        if (totalAllowed <= 0) {
            setError('You already have 3 images. Remove one to add more.');
            e.target.value = '';
            return;
        }
        const newFiles = Array.from(e.target.files).slice(0, totalAllowed);
        // Append to existing selections instead of replacing
        const merged = [...imageFiles, ...newFiles].slice(0, 3 - existingImages.length);
        setImageFiles(merged);
        setImagePreviews(merged.map((f) => URL.createObjectURL(f)));
        setError('');
    }

    async function uploadImages() {
        const uploaded = [];
        for (const file of imageFiles) {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: fd,
            });
            if (!res.ok) throw new Error('Image upload failed');
            const data = await res.json();
            uploaded.push({ url: data.url, publicId: data.publicId });
        }
        return uploaded;
    }

    async function handleSubmit() {
        setError('');
        setSuccess('');

        const { name, description, price, category, stock } = form;

        if (!name || !description || !price || !category || !stock) {
            return setError('All fields are required');
        }

        setSubmitting(true);

        try {
            // Start with whatever existing images are still kept
            let images = [...existingImages];

            // Upload new files and append
            if (imageFiles.length > 0) {
                const uploaded = await uploadImages();
                images = [...images, ...uploaded].slice(0, 3);
            }

            const payload = {
                name,
                description,
                price: Number(price),
                category,
                stock: Number(stock),
                images,
                offer: {
                    isOnOffer: form.isOnOffer,
                    discountPercent: form.isOnOffer ? Number(form.discountPercent) || 0 : 0,
                    offerLabel: form.isOnOffer ? form.offerLabel : '',
                    expiresAt: form.isOnOffer ? (form.offer?.expiresAt || null) : null,
                },
                isTopSelling: form.isTopSelling,
                variants: form.variants,
                deliveryRestriction: {
                    enabled: form.restrictDelivery,
                    allowedDistricts: form.allowedDistricts,
                },
                isTopSelling: form.isTopSelling,
            };

            // FIX: use PATCH (not PUT) to match the API route
            const url = editProduct
                ? `/api/products/${editProduct._id}`
                : '/api/products';

            const method = editProduct ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) return setError(data.message || 'Something went wrong');

            setSuccess(editProduct ? 'Product updated!' : 'Product added!');
            setShowForm(false);
            fetchProducts();
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setSuccess('Product deleted!');
            fetchProducts();
        } catch {
            setError('Failed to delete product');
        }
    }

    async function handleStockUpdate(id, newStock) {
        try {
            // FIX: use PATCH instead of PUT
            const res = await fetch(`/api/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: Number(newStock) }),
            });
            if (!res.ok) throw new Error('Stock update failed');
            fetchProducts();
        } catch {
            setError('Failed to update stock');
        }
    }

    const totalImages = existingImages.length + imageFiles.length;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-black">Products</h1>
                <button onClick={openAddForm} className="glass-btn-primary px-6 py-2 w-auto text-sm">
                    + Add Product
                </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="glass-input rounded-3xl w-auto text-sm"
                >
                    {categories.map((c) => (
                        <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                    ))}
                </select>
                <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="glass-input rounded-3xl w-auto text-sm"
                >
                    <option value="all">All Stock Levels</option>
                    <option value="low">Low Stock (≤30)</option>
                    <option value="high">High Stock ({'>'}30)</option>
                </select>
                <label className="flex items-center gap-2 glass-input rounded-3xl w-auto text-sm px-4 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={topSellingOnly}
                        onChange={(e) => setTopSellingOnly(e.target.checked)}
                        className="accent-[#3E2723]"
                    />
                    Top Selling Only
                </label>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-700 text-sm">
                    {success}
                </div>
            )}

            {/* Add / Edit Form */}
            {showForm && (
                <div className="glass rounded-3xl text-black p-6 mb-8">
                    <h2 className="text-black font-semibold mb-4">
                        {editProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-black/70 text-sm mb-1 block">Product Name</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Product name"
                                className="glass-input text-black placeholder:text-black/40 rounded-3xl"
                            />
                        </div>

                        <div>
                            <label className="text-black/70 text-sm mb-1 block">Category</label>
                            <input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                placeholder="e.g. Snacks, Drinks"
                                className="glass-input text-black placeholder:text-black/40 rounded-3xl"
                            />
                        </div>

                        <div>
                            <label className="text-black/70 text-sm mb-1 block">Price (৳)</label>
                            <input
                                name="price"
                                type="number"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="0"
                                className="glass-input text-black placeholder:text-black/40 rounded-3xl"
                            />
                        </div>

                        <div>
                            <label className="text-black/70 text-sm mb-1 block">Stock</label>
                            <input
                                name="stock"
                                type="number"
                                value={form.stock}
                                onChange={handleChange}
                                placeholder="0"
                                className="glass-input text-black placeholder:text-black/40 rounded-3xl"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-black/70 text-sm mb-1 block">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Product description"
                                rows={3}
                                className="glass-input resize-none text-black placeholder:text-black/40 rounded-3xl"
                            />
                        </div>

                        {/* ── OFFER SECTION ── */}
                        <div className="md:col-span-2">
                            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="isOnOffer"
                                        checked={form.isOnOffer}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-green-600"
                                    />
                                    <span className="text-black/80 text-sm font-medium">Enable Offer / Discount</span>
                                </label>

                                {form.isOnOffer && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                        <div>
                                            <label className="text-black/60 text-xs mb-1 block">
                                                Discount % (0–100)
                                            </label>
                                            <input
                                                name="discountPercent"
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={form.discountPercent}
                                                onChange={handleChange}
                                                placeholder="e.g. 20"
                                                className="glass-input text-black placeholder:text-black/40 rounded-3xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-black/60 text-xs mb-1 block">
                                                Offer Label (optional)
                                            </label>
                                            <input
                                                name="offerLabel"
                                                value={form.offerLabel}
                                                onChange={handleChange}
                                                placeholder="e.g. Eid Special, Flash Sale"
                                                className="glass-input text-black placeholder:text-black/40 rounded-3xl"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-black/60">Offer Ends At (optional)</label>
                            <DateTimePicker
                                value={form.offer?.expiresAt || ''}
                                onChange={(iso) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        offer: { ...prev.offer, expiresAt: iso || null },
                                    }))
                                }
                                className="w-full"
                            />
                            <p className="text-xs text-black/40 mt-1">Leave empty for an offer with no time limit.</p>
                        </div>

                        {/* ── TOP SELLING TOGGLE ── */}
                        <div className="md:col-span-2">
                            <div className="glass rounded-2xl p-4">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="isTopSelling"
                                        checked={form.isTopSelling}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-green-600"
                                    />
                                    <span className="text-black/80 text-sm font-medium">
                                        🔥 Show in Top Selling slider (homepage)
                                    </span>
                                </label>
                                <p className="text-black/40 text-xs mt-1 ml-6">
                                    You decide which products appear here — no automatic calculation.
                                </p>
                            </div>
                        </div>

                        {/* ── QUANTITY VARIANTS ── */}
                        <div className="md:col-span-2">
                            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
                                <p className="text-black/80 text-sm font-medium">
                                    📦 Quantity Variants <span className="text-black/40 font-normal">(optional — e.g. 100ml, 250ml, 1kg)</span>
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <input
                                        type="text"
                                        value={variantLabel}
                                        onChange={(e) => setVariantLabel(e.target.value)}
                                        placeholder="Label e.g. 100ml, 1kg, Small"
                                        className="glass-input text-black placeholder:text-black/40 rounded-3xl flex-1 min-w-0"
                                    />
                                    <input
                                        type="number"
                                        value={variantPrice}
                                        onChange={(e) => setVariantPrice(e.target.value)}
                                        placeholder="Price ৳"
                                        className="glass-input text-black placeholder:text-black/40 rounded-3xl w-28"
                                    />
                                    <button type="button" onClick={addVariant} className="glass-btn px-4 py-2 w-auto text-sm">
                                        + Add
                                    </button>
                                </div>
                                {form.variants.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {form.variants.map((v, i) => (
                                            <div key={i} className="flex items-center gap-1.5 bg-black/10 rounded-full px-3 py-1 text-sm text-black">
                                                <span>{v.label} — ৳{v.price}</span>
                                                <button type="button" onClick={() => removeVariant(i)} className="text-black/40 hover:text-red-600 transition font-bold">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-black/30 text-xs">If variants are added, customer selects one before adding to cart.</p>
                            </div>
                        </div>

                        {/* ── DELIVERY RESTRICTION ── */}
                        <div className="md:col-span-2">
                            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="restrictDelivery"
                                        checked={form.restrictDelivery}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-green-600"
                                    />
                                    <span className="text-black/80 text-sm font-medium">
                                        🚚 Restrict delivery to specific districts
                                    </span>
                                </label>
                                <p className="text-black/40 text-xs ml-6">
                                    e.g. birthday cake only deliverable to Dhaka & Chattogram. Customer can only select these districts at checkout.
                                </p>

                                {form.restrictDelivery && (
                                    <div className="flex flex-col gap-3 mt-1">
                                        {/* District picker + charge */}
                                        <div className="flex gap-2 flex-wrap">
                                            <select
                                                value={restrictDistrictInput}
                                                onChange={(e) => setRestrictDistrictInput(e.target.value)}
                                                className="glass-input text-black rounded-3xl flex-1 min-w-0"
                                            >
                                                <option value="">Select district...</option>
                                                {BD_DISTRICTS.filter(
                                                    (d) => !form.allowedDistricts.find((a) => a.district === d)
                                                ).map((d) => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                value={restrictChargeInput}
                                                onChange={(e) => setRestrictChargeInput(e.target.value)}
                                                placeholder="Charge ৳"
                                                className="glass-input text-black placeholder:text-black/40 rounded-3xl w-28"
                                            />
                                            <button
                                                type="button"
                                                onClick={addRestrictedDistrict}
                                                className="glass-btn px-4 py-2 w-auto text-sm"
                                            >
                                                + Add
                                            </button>
                                        </div>

                                        {/* Added districts */}
                                        {form.allowedDistricts.length > 0 && (
                                            <div className="flex gap-2 flex-wrap">
                                                {form.allowedDistricts.map((d, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 bg-black/10 rounded-full px-3 py-1 text-sm text-black">
                                                        <span>{d.district} — {d.charge === 0 ? 'Free' : `৳${d.charge}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRestrictedDistrict(d.district)}
                                                            className="text-black/40 hover:text-red-600 transition font-bold"
                                                        >✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {form.allowedDistricts.length === 0 && (
                                            <p className="text-red-500/70 text-xs">Add at least one district, otherwise restriction won't apply.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── IMAGE UPLOAD ── */}
                        <div className="md:col-span-2">
                            <label className="text-black/70 text-sm mb-1 block">
                                Product Images ({totalImages}/3 used)
                            </label>

                            {/* Existing images from DB */}
                            {existingImages.length > 0 && (
                                <div className="flex gap-2 mb-3 flex-wrap">
                                    {existingImages.map((img, index) => (
                                        <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                                            <Image
                                                src={img.url}
                                                alt={`Existing ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(index)}
                                                className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-bl-lg opacity-0 group-hover:opacity-100 transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* New file picker — only show if under 3 total */}
                            {totalImages < 3 && (
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="glass-input"
                                />
                            )}

                            {totalImages >= 3 && (
                                <p className="text-xs text-black/50 mt-1">
                                    Maximum 3 images reached. Remove an existing image to upload a new one.
                                </p>
                            )}

                            {/* New image previews */}
                            {imagePreviews.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {imagePreviews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className="relative w-20 h-20 rounded-lg overflow-hidden"
                                        >
                                            <Image
                                                src={preview}
                                                alt={`New ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="glass-btn-primary px-6 py-2 w-auto text-sm"
                        >
                            {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="glass-btn px-6 py-2 w-auto text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name..."
                className="glass-input rounded-3xl w-full mb-4"
            />

            {/* Products List */}
            {loading ? (
                <div className="glass rounded-3xl text-black p-8 text-center">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="glass rounded-3xl text-black p-8 text-center">
                    No products yet. Add your first product!
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {products
                        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                        .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
                        .filter((p) => {
                            if (stockFilter === 'low') return p.stock <= 30;
                            if (stockFilter === 'high') return p.stock > 30;
                            return true;
                        })
                        .filter((p) => !topSellingOnly || p.isTopSelling)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((product) => (
                            <div
                                key={product._id}
                                className="glass rounded-3xl text-black p-4 flex flex-col md:flex-row md:items-center gap-4"
                            >
                                {/* Image */}
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                    {product.images?.[0]?.url ? (
                                        <Image
                                            src={product.images[0].url}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-black/40 text-xs">
                                            No img
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <p className="text-black font-medium text-sm">{product.name}</p>
                                    <p className="text-black/60 text-xs">{product.category}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-blue-600 text-sm font-bold">৳{product.price.toLocaleString()}</p>
                                        {product.offer?.isOnOffer && (
                                            <span className="text-xs bg-green-500/20 text-green-700 border border-green-500/30 px-2 py-0.5 rounded-full">
                                                {product.offer.discountPercent}% off
                                                {product.offer.offerLabel ? ` · ${product.offer.offerLabel}` : ''}
                                            </span>
                                        )}
                                        {product.isTopSelling && (
                                            <span className="text-xs bg-orange-500/20 text-orange-700 border border-orange-500/30 px-2 py-0.5 rounded-full">
                                                🔥 Top Selling
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Live Stock Update */}
                                <div className="flex items-center gap-2">
                                    <div className="text-black/60 text-xs">Stock:</div>
                                    <input
                                        type="number"
                                        defaultValue={product.stock}
                                        min={0}
                                        onBlur={(e) => handleStockUpdate(product._id, e.target.value)}
                                        className="glass-input w-20 text-sm text-center py-1 text-black"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditForm(product)}
                                        className="glass-btn text-xs px-3 py-1 w-auto"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product._id)}
                                        className="bg-red-500/20 border border-red-500/30 text-red-700 text-xs px-3 py-1 rounded-lg hover:bg-red-500/30 transition w-auto"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}