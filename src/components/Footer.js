import Link from 'next/link';

// Server component — fetches settings directly
async function getSettings() {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/settings`,
            { cache: 'no-store' }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.settings;
    } catch {
        return null;
    }
}

export default async function Footer() {
    const settings = await getSettings();

    return (
        <footer className="glass border-t border-black/10 mt-12">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

                    {/* Column 1 — Shop Info */}
                    <div>
                        <h3 className="text-black font-bold text-lg mb-3">
                            {settings?.shopName || 'Auhentic'}
                        </h3>
                        <p className="text-black/50 text-sm mb-3">
                            {settings?.tagline || 'Fresh food delivered to your door'}
                        </p>
                        {settings?.address && (
                            <p className="text-black/40 text-xs leading-relaxed">
                                📍 {settings.address}
                            </p>
                        )}
                        {settings?.deliveryAreas && (
                            <p className="text-black/40 text-xs mt-2">
                                🚚 Delivers to: {settings.deliveryAreas}
                            </p>
                        )}
                    </div>

                    {/* Column 2 — Quick Links */}
                    <div>
                        <h3 className="text-black font-semibold mb-3">Quick Links</h3>
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/"
                                className="text-black/50 hover:text-black text-sm transition"
                            >
                                Home
                            </Link>
                            <Link
                                href="/products"
                                className="text-black/50 hover:text-black text-sm transition"
                            >
                                Products
                            </Link>
                            <Link
                                href="/cart"
                                className="text-black/50 hover:text-black text-sm transition"
                            >
                                Cart
                            </Link>
                            <Link
                                href="/contact"
                                className="text-black/50 hover:text-black text-sm transition"
                            >
                                Contact Us
                            </Link>
                            <Link
                                href="/orders"
                                className="text-black/50 hover:text-black text-sm transition"
                            >
                                Track Order
                            </Link>
                        </div>
                    </div>

                    {/* Column 3 — Contact */}
                    <div>
                        <h3 className="text-black font-semibold mb-3">Contact Us</h3>
                        <div className="flex flex-col gap-2">
                            {settings?.phone && (
                                <a
                                    href={`tel:${settings.phone}`}
                                    className="text-black/50 hover:text-black text-sm transition"
                                >
                                    📞 {settings.phone}
                                </a>
                            )}

                            {settings?.email && (
                                <a
                                    href={`mailto:${settings.email}`}
                                    className="text-black/50 hover:text-black text-sm transition"
                                >
                                    ✉️ {settings.email}
                                </a>
                            )}
                        </div>

                        {/* Social Links Row (Facebook, Instagram, WhatsApp) */}
                        {(settings?.facebook || settings?.instagram || settings?.whatsapp) && (
                            <div className="flex items-center gap-3 mt-4">
                                {settings?.facebook && (
                                    <a
                                        href={settings.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass rounded-full p-2.5 text-blue-600 hover:bg-blue-600 transition flex items-center justify-center w-9 h-9"
                                        aria-label="Facebook"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                    </a>
                                )}
                                {settings?.instagram && (
                                    <a
                                        href={settings.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass rounded-full p-2.5 text-red-500 hover:bg-red-500 transition flex items-center justify-center w-9 h-9"
                                        aria-label="Instagram"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                    </a>
                                )}
                                {settings?.whatsapp && (
                                    <a
                                        href={`https://wa.me/88${settings.whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass rounded-full p-2.5 text-green-600 hover:bg-green-600 transition flex items-center justify-center w-9 h-9"
                                        aria-label="WhatsApp"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 11.948 0c3.174.001 6.161 1.24 8.401 3.487 2.24 2.248 3.474 5.24 3.472 8.414-.003 6.59-5.339 11.937-11.89 11.937-2.006-.001-3.974-.507-5.719-1.472L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.757 1.451 5.316 0 9.647-4.32 9.649-9.643.001-2.578-1.001-5-2.822-6.822s-4.238-2.827-6.816-2.828c-5.321 0-9.652 4.322-9.654 9.645-.001 1.632.448 3.225 1.298 4.632l-.991 3.619 3.728-.978zm11.365-4.433c-.29-.146-1.716-.848-1.981-.944-.266-.096-.46-.145-.652.146-.193.29-.747.944-.916 1.137-.168.193-.338.217-.628.072-.29-.146-1.228-.452-2.339-1.444-.864-.771-1.448-1.723-1.617-2.014-.169-.29-.018-.447.127-.591.131-.13.29-.338.436-.508.145-.169.193-.29.29-.483.096-.193.048-.361-.024-.507-.072-.146-.652-1.573-.893-2.152-.235-.568-.475-.491-.652-.5h-.557c-.193 0-.507.072-.772.361-.266.29-1.014.992-1.014 2.417 0 1.425 1.038 2.803 1.182 2.997.145.193 2.041 3.117 4.945 4.373.69.299 1.229.478 1.649.612.693.221 1.324.19 1.821.116.554-.082 1.716-.701 1.958-1.377.243-.676.243-1.256.17-1.377-.073-.121-.266-.193-.556-.34z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-black/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p className="text-black/30 text-xs">
                        {settings?.footerMessage || 'Auhentic is actually Authentic'}
                    </p>
                    <p className="text-black/20 text-xs">
                        © {new Date().getFullYear()}{' '}
                        {settings?.shopName || 'Auhentic'}. All rights reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
}