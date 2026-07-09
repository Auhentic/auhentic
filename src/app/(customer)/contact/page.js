import Footer from '@/components/Footer';

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

export default async function ContactPage() {
    const settings = await getSettings();

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-white mb-8">Contact Us</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Contact Info */}
                <div className="flex flex-col gap-4">

                    {settings?.phone && (
                        <div className="glass p-5">
                            <p className="text-white/50 text-xs mb-1">Phone</p>
                            <a
                                href={`tel:${settings.phone}`}
                                className="text-white font-medium hover:text-blue-400 transition"
                            >
                                📞 {settings.phone}
                            </a>
                        </div>
                    )}

                    {settings?.whatsapp && (
                        <div className="glass p-5">
                            <p className="text-white/50 text-xs mb-1">WhatsApp</p>
                            <a
                                href={`https://wa.me/88${settings.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white font-medium hover:text-green-400 transition"
                            >
                                💬 {settings.whatsapp}
                            </a>
                        </div>
                    )}

                    {settings?.email && (
                        <div className="glass p-5">
                            <p className="text-white/50 text-xs mb-1">Email</p>
                            <a
                                href={`mailto:${settings.email}`}
                                className="text-white font-medium hover:text-blue-400 transition"
                            >
                                ✉️ {settings.email}
                            </a>
                        </div>
                    )}

                    {settings?.address && (
                        <div className="glass p-5">
                            <p className="text-white/50 text-xs mb-1">Address</p>
                            <p className="text-white font-medium">
                                📍 {settings.address}
                            </p>
                        </div>
                    )}

                    {settings?.deliveryAreas && (
                        <div className="glass p-5">
                            <p className="text-white/50 text-xs mb-1">Delivery Areas</p>
                            <p className="text-white font-medium">
                                🚚 {settings.deliveryAreas}
                            </p>
                        </div>
                    )}

                </div>

                {/* Social + Message */}
                <div className="flex flex-col gap-4">

                    {(settings?.facebook || settings?.instagram) && (
                        <div className="glass p-5">
                            <p className="text-white/50 text-xs mb-3">Follow Us</p>
                            <div className="flex flex-col gap-3">
                                {settings?.facebook && (
                                    <a
                                        href={settings.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/70 hover:text-white transition text-sm"
                                    >
                                        👍 Facebook Page
                                    </a>
                                )}
                                {settings?.instagram && (
                                    <a
                                        href={settings.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/70 hover:text-white transition text-sm"
                                    >
                                        📸 Instagram
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="glass p-5">
                        <p className="text-white/50 text-xs mb-2">Business Hours</p>
                        <p className="text-white text-sm">
                            Saturday – Thursday
                        </p>
                        <p className="text-white/60 text-sm">
                            10:00 AM – 10:00 PM
                        </p>
                        <p className="text-white/40 text-xs mt-2">
                            Friday: Closed
                        </p>
                    </div>

                    <div className="glass p-5">
                        <p className="text-white font-medium mb-2">
                            Need help with your order?
                        </p>
                        <p className="text-white/50 text-sm">
                            WhatsApp or call us directly for fastest response.
                            We typically reply within 30 minutes during business hours.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}