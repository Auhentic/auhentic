'use client';

import { useState, useEffect } from 'react';

// All 64 districts of Bangladesh
const BD_DISTRICTS = [
    'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria',
    'Chandpur', 'Chapai Nawabganj', 'Chattogram', 'Chuadanga', 'Cox\'s Bazar', 'Cumilla',
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

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        shopName: '',
        tagline: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        deliveryAreas: '',
        facebook: '',
        instagram: '',
        footerMessage: '',
        freeDeliveryAmount: 500,
        freeDeliveryText: '',
    });

    // District delivery charges — array of { district, charge }
    const [districtDelivery, setDistrictDelivery] = useState([]);
    const [newDistrict, setNewDistrict] = useState('');
    const [newCharge, setNewCharge] = useState('');

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                const s = data.settings;
                setForm({
                    shopName: s.shopName || '',
                    tagline: s.tagline || '',
                    email: s.email || '',
                    phone: s.phone || '',
                    whatsapp: s.whatsapp || '',
                    address: s.address || '',
                    deliveryAreas: s.deliveryAreas || '',
                    facebook: s.facebook || '',
                    instagram: s.instagram || '',
                    footerMessage: s.footerMessage || '',
                    freeDeliveryAmount: s.freeDeliveryAmount ?? '',
                    freeDeliveryText: s.freeDeliveryText ?? '',
                });
                setDistrictDelivery(s.districtDelivery || []);
            } catch {
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    }

    function addDistrict() {
        if (!newDistrict || !newCharge) return;
        if (districtDelivery.find((d) => d.district === newDistrict)) {
            setError(`${newDistrict} is already in the list. Edit or remove it first.`);
            return;
        }
        setDistrictDelivery([
            ...districtDelivery,
            { district: newDistrict, charge: Number(newCharge) },
        ]);
        setNewDistrict('');
        setNewCharge('');
        setError('');
    }

    function removeDistrict(district) {
        setDistrictDelivery(districtDelivery.filter((d) => d.district !== district));
    }

    function updateCharge(district, charge) {
        setDistrictDelivery(
            districtDelivery.map((d) =>
                d.district === district ? { ...d, charge: Number(charge) } : d
            )
        );
    }

    async function handleSave() {
        setError('');
        setSuccess('');

        if (!form.shopName) return setError('Shop name is required');

        setSaving(true);

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, districtDelivery }),
            });

            const data = await res.json();
            if (!res.ok) return setError(data.message);
            setSuccess('Settings saved successfully!');
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setSaving(false);
        }
    }

    // Districts not yet added
    const availableDistricts = BD_DISTRICTS.filter(
        (d) => !districtDelivery.find((dd) => dd.district === d)
    );

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center">
                <div className="glass p-12 text-black rounded-3xl">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-black mb-8">Shop Settings</h1>

            {error && (
                <div className="mb-4 p-3 rounded-3xl bg-red-500/20 border border-red-500/30 text-[#3E2723] text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-3xl bg-green-500/20 border border-[#3E2723]/30 text-[#3E2723] text-sm">
                    {success}
                </div>
            )}

            {/* Basic Info */}
            <div className="glass p-6 mb-4 rounded-3xl">
                <h2 className="text-black font-semibold mb-4">Basic Information</h2>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-black text-sm mb-1 block">Shop Name *</label>
                        <input name="shopName" value={form.shopName} onChange={handleChange}
                            placeholder="Auhentic" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                    <div>
                        <label className="text-black text-sm mb-1 block">Tagline</label>
                        <input name="tagline" value={form.tagline} onChange={handleChange}
                            placeholder="Fresh food delivered to your door" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                    <div>
                        <label className="text-black text-sm mb-1 block">Footer Message</label>
                        <input name="footerMessage" value={form.footerMessage} onChange={handleChange}
                            placeholder="Auhentic is actually Authentic" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="glass p-6 mb-4 rounded-3xl">
                <h2 className="text-black font-semibold mb-4">Contact Information</h2>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-black text-sm mb-1 block">Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            placeholder="shop@auhentic.com" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                    <div>
                        <label className="text-black text-sm mb-1 block">Phone Number</label>
                        <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                            placeholder="01XXXXXXXXX" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                    <div>
                        <label className="text-black text-sm mb-1 block">WhatsApp Number</label>
                        <input name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange}
                            placeholder="01XXXXXXXXX" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                    <div>
                        <label className="text-black text-sm mb-1 block">Shop Address</label>
                        <textarea name="address" value={form.address} onChange={handleChange}
                            placeholder="House, Road, Area, City" rows={2}
                            className="glass-input resize-none rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                    <div>
                        <label className="text-black text-sm mb-1 block">Delivery Areas (general note)</label>
                        <textarea name="deliveryAreas" value={form.deliveryAreas} onChange={handleChange}
                            placeholder="Dhaka, Chittagong, Sylhet..." rows={2}
                            className="glass-input resize-none rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                </div>
            </div>

            {/* Delivery Settings */}
            <div className="glass rounded-3xl p-6 mb-4">
                <h2 className="text-black font-semibold mb-1">Delivery Settings</h2>
                <p className="text-black/40 text-xs mb-4">Set per-district charges. Customers will see the charge auto-applied when they select their district at checkout.</p>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-black/70 text-sm mb-1 block">Free Delivery Minimum (৳)</label>
                        <input name="freeDeliveryAmount" type="number" value={form.freeDeliveryAmount} onChange={handleChange}
                            placeholder="1000" className="glass-input rounded-3xl text-black" />
                        <p className="text-black/30 text-xs mt-1">Orders above this amount get free delivery (overrides district charge)</p>
                    </div>
                    <div>
                        <label className="text-black/70 text-sm mb-1 block">Free Delivery Banner Text</label>
                        <input name="freeDeliveryText" value={form.freeDeliveryText} onChange={handleChange}
                            placeholder="Free delivery on orders over ৳1000" className="glass-input rounded-3xl text-black" />
                    </div>
                </div>

                {/* District Delivery Charges */}
                {/* <div className="mt-6">
                    <h3 className="text-black/80 text-sm font-semibold mb-3">District-wise Delivery Charges</h3>

                    <div className="flex gap-2 mb-4">
                        <select
                            value={newDistrict}
                            onChange={(e) => setNewDistrict(e.target.value)}
                            className="glass-input rounded-3xl text-black flex-1 w-1/3 text-sm"
                        >
                            <option value="">Select district...</option>
                            {availableDistricts.map((d) => (
                                <option key={d} value={d} className="bg-[#bbf7d0] text-black">{d}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={newCharge}
                            onChange={(e) => setNewCharge(e.target.value)}
                            placeholder="৳ Charge"
                            min={0}
                            className="glass-input rounded-3xl text-black flex-1 w-1/3 text-sm"
                        />
                        <button
                            onClick={addDistrict}
                            className="glass-btn-primary px-4 py-2 flex-1 w-1/3 text-sm whitespace-nowrap"
                        >
                            + Add
                        </button>
                    </div>

                    {districtDelivery.length === 0 ? (
                        <p className="text-black/30 text-sm text-center py-4">
                            No districts added yet. Add districts above to set delivery charges.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                            {districtDelivery
                                .slice()
                                .sort((a, b) => a.district.localeCompare(b.district))
                                .map(({ district, charge }) => (
                                    <div key={district} className="flex items-center gap-3 glass rounded-2xl px-4 py-2">
                                        <span className="text-black text-sm flex-1">{district}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-black/50 text-xs">৳</span>
                                            <input
                                                type="number"
                                                value={charge}
                                                min={0}
                                                onChange={(e) => updateCharge(district, e.target.value)}
                                                className="glass-input rounded-2xl text-black text-sm text-center w-24 py-1"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeDistrict(district)}
                                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}

                    {districtDelivery.length > 0 && (
                        <p className="text-black/30 text-xs mt-2">
                            {districtDelivery.length} district{districtDelivery.length !== 1 ? 's' : ''} configured · {BD_DISTRICTS.length - districtDelivery.length} remaining
                        </p>
                    )}
                </div> */}
            </div>

            {/* Social Links */}
            <div className="glass p-6 mb-6 rounded-3xl">
                <h2 className="text-black font-semibold mb-4">Social Media Links</h2>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-black text-sm mb-1 block">Facebook Page URL</label>
                        <input name="facebook" value={form.facebook} onChange={handleChange}
                            placeholder="https://facebook.com/yourpage" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                    <div>
                        <label className="text-black text-sm mb-1 block">Instagram URL</label>
                        <input name="instagram" value={form.instagram} onChange={handleChange}
                            placeholder="https://instagram.com/yourpage" className="glass-input rounded-3xl text-black placeholder:text-black/50" />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="glass-btn-primary py-3 text-base font-bold w-full text-black"
            >
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
}
