import TopSellingSlider from '@/components/TopSellingSlider';
import ProductScrollRow from '@/components/ProductScrollRow';
import CategorySection from '@/components/CategorySection';
import { isOfferActive } from '@/lib/offerUtils';

async function getAllProducts() {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/products?limit=200`,
            { cache: 'no-store' }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.products || data.data || [];
    } catch {
        return [];
    }
}

async function getTopSelling() {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/products?topSelling=true&limit=9`,
            { cache: 'no-store' }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.products || data.data || [];
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const [products, topSelling] = await Promise.all([
        getAllProducts(),
        getTopSelling(),
    ]);

    // Offer products
    const offerProducts = products.filter(
        (p) => isOfferActive(p.offer) && p.offer?.discountPercent > 0
    );

    // Limited-time offers — same as offerProducts but only the ones with
    // an active expiry countdown, so they get their own homepage category.
    const limitedTimeOffers = offerProducts.filter(
        (p) => p.offer?.expiresAt && new Date(p.offer.expiresAt).getTime() > Date.now()
    );

    // Build per-category product lists, preserving insertion order
    const categoryMap = new Map();
    for (const p of products) {
        if (!p.category) continue;
        if (!categoryMap.has(p.category)) categoryMap.set(p.category, []);
        categoryMap.get(p.category).push(p);
    }
    const categoryRows = Array.from(categoryMap.entries()).map(([name, items]) => ({
        name,
        products: items,
    }));

    // Prepend "Limited Time Offer" as its own selectable category chip/row
    if (limitedTimeOffers.length > 0) {
        categoryRows.unshift({
            name: 'Limited Time Offer',
            icon: '⏰',
            products: limitedTimeOffers,
            seeAllHref: '/products?limited=true',
        });
    }

    return (
        <main>

            {/*
              HERO BLOCK — fills viewport below navbar using flex-grow ratios.
              Top Selling: flex-grow 4 (≈40% of remaining height)
              Offer row:   flex-grow 2 (≈20%)
              Total hero   flex-grow 6 = 100% of calc(100vh - navbar)
            */}
            <section
                className="w-full flex flex-col gap-4 px-4 py-4 lg:h-[calc(100vh-var(--navbar-height,68px))] h-auto"
            >
                {/* Top Selling — 40% */}
                <div className="w-full lg:flex-[4_1_0%] lg:min-h-0">
                    {topSelling.length > 0 ? (
                        <TopSellingSlider products={topSelling} />
                    ) : (
                        <div className="w-full h-full rounded-2xl glass flex items-center justify-center min-h-[200px]">
                            <p className="text-white/50 text-sm">
                                No top selling products yet — mark some from Admin → Products
                            </p>
                        </div>
                    )}
                </div>

                {/* Ongoing Offer Row — 20% */}
                {offerProducts.length > 0 && (
                    <div className="w-full lg:flex-[2_1_0%] lg:min-h-0">
                        <ProductScrollRow
                            title="Ongoing Offer Product"
                            icon="🏷️"
                            seeAllHref="/products?offer=true"
                            seeAllLabel="See All Offer"
                            products={offerProducts}
                        />
                    </div>
                )}
            </section>

            {/*
              BELOW HERO — Category rows, each scrollable.
              CategorySection is a client component so it can handle
              the selectable category chip filter at the top.
            */}
            <section className="px-4 pb-16 pt-6 flex flex-col gap-8">
                <CategorySection categoryRows={categoryRows} />
            </section>

        </main>
    );
}
