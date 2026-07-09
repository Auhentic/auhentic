import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Image from 'next/image';
import SendCartOffer from '@/components/admin/SendCartOffer';

async function getCarts() {
    await connectDB();
    const carts = await Cart.find({ 'items.0': { $exists: true } })
        .populate('user', 'name email phone')
        .sort({ updatedAt: -1 });
    return carts;
}

export default async function AdminCartsPage() {
    const carts = await getCarts();

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-black">Abandoned Carts</h1>
                    <p className="text-black/50 text-sm mt-1">
                        Customers with items in cart who haven't ordered yet
                    </p>
                </div>
                <span className="glass px-4 py-2 rounded-full text-black/60 text-sm">
                    {carts.length} active cart{carts.length !== 1 ? 's' : ''}
                </span>
            </div>

            {carts.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center">
                    <p className="text-black/40 text-lg">No abandoned carts right now 🎉</p>
                    <p className="text-black/30 text-sm mt-1">All customers have either checked out or emptied their carts</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {carts.map((cart) => {
                        const cartTotal = cart.items.reduce(
                            (sum, item) => sum + item.price * item.quantity, 0
                        );
                        const lastUpdated = new Date(cart.updatedAt).toLocaleDateString('en-BD', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        });

                        return (
                            <div key={cart._id} className="glass rounded-3xl p-5 text-black">
                                {/* Customer Info */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <p className="font-semibold text-black">
                                            {cart.user?.name || 'Unknown User'}
                                        </p>
                                        <p className="text-black/50 text-xs">{cart.user?.email}</p>
                                        {cart.user?.phone && (
                                            <p className="text-black/50 text-xs">📞 {cart.user.phone}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-black/40 text-xs">Last updated</p>
                                        <p className="text-black/60 text-xs">{lastUpdated}</p>
                                        <p className="text-[#c8860a] font-bold mt-1">
                                            Cart total: ৳{cartTotal.toLocaleString()}
                                        </p>
                                        <SendCartOffer
                                            cartId={cart._id.toString()}
                                            existingOffer={{
                                                discountPercent: cart.personalOffer?.discountPercent || 0,
                                                message: cart.personalOffer?.message || '',
                                                expiresAt: cart.personalOffer?.expiresAt ? cart.personalOffer.expiresAt.toISOString() : null,
                                                active: cart.personalOffer?.active || false,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="flex flex-col gap-2">
                                    {cart.items.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 bg-black/5 rounded-2xl p-3"
                                        >
                                            {/* Image */}
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/10 shrink-0">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-black/20 text-xs">
                                                        No img
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-black text-sm font-medium line-clamp-1">
                                                    {item.name}
                                                </p>
                                                {item.variant && (
                                                    <p className="text-black/40 text-xs">{item.variant}</p>
                                                )}
                                            </div>

                                            {/* Price × Qty */}
                                            <div className="text-right shrink-0">
                                                <p className="text-black/60 text-xs">
                                                    ৳{item.price.toLocaleString()} × {item.quantity}
                                                </p>
                                                <p className="text-black font-bold text-sm">
                                                    ৳{(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
