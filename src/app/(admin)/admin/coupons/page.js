'use client';

import { useState, useEffect } from 'react';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        code: '',
        scope: 'product',
        targetProduct: '',
        targetCategory: '',
        discountPercent: '',
        expiresAt: '',
    });

    useEffect(() => {
        fetchCoupons();
        fetch('/api/products?limit=200')
            .then((r) => r.json())
            .then((d) => setCategories([...new Set((d.products || []).map((p) => p.category).filter(Boolean))]));
    }, []);

    async function fetchCoupons() {
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            setCoupons(data.coupons || []);
        } catch {
            setError('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    }

    // Search customer by phone/email/name (reuses the same team search endpoint)
    useEffect(() => {
        if (!customerSearch) return setCustomerResults([]);
        const t = setTimeout(async () => {
            const res = await fetch(`/api/admin/team?search=${encodeURIComponent(customerSearch)}`);
            const data = await res.json();
            setCustomerResults(data.users || []);
        }, 300);
        return () => clearTimeout(t);
    }, [customerSearch]);

    // Search product by name
    useEffect(() => {
        if (!productSearch) return setProductResults([]);
        const t = setTimeout(async () => {
            const res = await fetch(`/api/products?search=${encodeURIComponent(productSearch)}`);
            const data = await res.json();
            setProductResults(data.products || []);
        }, 300);
        return () => clearTimeout(t);
    }, [productSearch]);

    function generateCode() {
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        setForm((f) => ({ ...f, code: `AUH-${random}` }));
    }

    async function handleCreate() {
        setError('');
        setSuccess('');

        if (!selectedCustomer) return setError('Select a customer first');
        if (!form.code) return setError('Generate or type a coupon code');
        if (!form.discountPercent) return setError('Enter a discount percentage');
        if (form.scope === 'product' && !form.targetProduct) return setError('Select a product');
        if (form.scope === 'category' && !form.targetCategory) return setError('Select a category');

        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    targetPhone: selectedCustomer.phone,
                    targetEmail: selectedCustomer.email,
                }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.message);

            setSuccess(`Coupon ${data.coupon.code} created for ${selectedCustomer.name}`);
            setForm({ code: '', scope: 'product', targetProduct: '', targetCategory: '', discountPercent: '', expiresAt: '' });
            setSelectedCustomer(null);
            setCustomerSearch('');
            fetchCoupons();
        } catch {
            setError('Something went wrong');
        }
    }

    async function handleDeactivate(id) {
        await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
        fetchCoupons();
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-black mb-2">Personal Coupons</h1>
            <p className="text-black/50 text-sm mb-8">
                Give a specific customer a private discount on one product or category.
            </p>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-[#3E2723] text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-[#3E2723]/30 text-[#3E2723] text-sm">{success}</div>}

            {/* Create Coupon Form */}
            <div className="glass rounded-3xl p-6 mb-8 flex flex-col gap-4">
                <h3 className="text-black font-semibold text-sm">New Coupon</h3>

                {/* Customer picker */}
                <div className="relative">
                    <input
                        type="text"
                        value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone || selectedCustomer.email})` : customerSearch}
                        onChange={(e) => {
                            setSelectedCustomer(null);
                            setCustomerSearch(e.target.value);
                        }}
                        placeholder="Search customer by phone, name, or email..."
                        className="glass-input rounded-3xl w-full"
                    />
                    {customerResults.length > 0 && !selectedCustomer && (
                        <div className="absolute z-10 top-full mt-1 left-0 right-0 glass rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                            {customerResults.map((u) => (
                                <div
                                    key={u._id}
                                    onClick={() => {
                                        setSelectedCustomer(u);
                                        setCustomerResults([]);
                                    }}
                                    className="px-4 py-2 text-sm hover:bg-black/5 cursor-pointer text-black"
                                >
                                    {u.name} — {u.phone || u.email}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scope */}
                <div className="flex gap-3">
                    <select
                        value={form.scope}
                        onChange={(e) => setForm({ ...form, scope: e.target.value, targetProduct: '', targetCategory: '' })}
                        className="glass-inputs rounded-3xl w-[50%]"
                    >
                        <option value="product">Specific Product</option>
                        <option value="category">Whole Category</option>
                    </select>

                    {form.scope === 'product' ? (
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Search product..."
                                className="glass-inputs rounded-3xl w-[100%]"
                            />
                            {productResults.length > 0 && (
                                <div className="absolute z-10 top-full mt-1 left-0 right-0 glass rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                                    {productResults.map((p) => (
                                        <div
                                            key={p._id}
                                            onClick={() => {
                                                setForm({ ...form, targetProduct: p._id });
                                                setProductSearch(p.name);
                                                setProductResults([]);
                                            }}
                                            className="px-4 py-2 text-sm hover:bg-black/5 cursor-pointer text-black"
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <select
                            value={form.targetCategory}
                            onChange={(e) => setForm({ ...form, targetCategory: e.target.value })}
                            className="glass-input rounded-3xl flex-1"
                        >
                            <option value="">Select category...</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Discount + code */}
                <div className="flex gap-3">
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={form.discountPercent}
                        onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                        placeholder="Discount %"
                        className="glass-inputs rounded-3xl w-[33%]"
                    />
                    <input
                        type="text"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        placeholder="Coupon code"
                        className="glass-input rounded-3xl flex-1"
                    />
                    <button onClick={generateCode} className="glass-inputs px-4 py-2 rounded-3xl text-sm w-[33%] ">
                        🎲 Generate
                    </button>
                </div>

                <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="glass-input rounded-3xl w-auto"
                />

                <button onClick={handleCreate} className="glass-btn-primary px-6 py-2 w-auto text-sm">
                    Create Coupon
                </button>
            </div>

            {/* Existing Coupons */}
            {loading ? (
                <div className="glass rounded-xl p-8 text-center text-black/50">Loading...</div>
            ) : (
                <div className="flex flex-col gap-3">
                    {coupons
                        .filter((c) => c.active || c.usedInOrder)
                        .map((c) => (
                            <div key={c._id} className="glass rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <p className="text-black font-medium text-sm">{c.code}</p>
                                    <p className="text-black/50 text-xs">
                                        {c.targetPhone || c.targetEmail} — {c.discountPercent}% off{' '}
                                        {c.scope === 'product' ? c.targetProduct?.name : c.targetCategory}
                                    </p>
                                    <p className="text-black/30 text-xs">
                                        {c.usedInOrder ? `Used — Order #${c.usedInOrder.orderNumber}` : c.active ? 'Active' : 'Deactivated'}
                                    </p>
                                </div>
                                {c.active && !c.usedInOrder && (
                                    <button
                                        onClick={() => handleDeactivate(c._id)}
                                        className="text-xs bg-red-500/20 border border-red-500/30 text-red-700 px-3 py-1 rounded-full hover:bg-red-500/30 transition"
                                    >
                                        Deactivate
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}