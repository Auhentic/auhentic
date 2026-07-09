import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import Link from 'next/link';

async function getStats() {
    await connectDB();

    const [totalProducts, totalOrders, totalUsers, orders] = await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments({ role: 'customer' }),
        Order.find().select('total orderStatus'),
    ]);

    const totalRevenue = orders
        .filter((o) => o.orderStatus === 'delivered')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    const pendingOrders = orders.filter(
        (o) => o.orderStatus === 'placed' || o.orderStatus === 'confirmed'
    ).length;

    return { totalProducts, totalOrders, totalUsers, totalRevenue, pendingOrders };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    const cards = [
        {
            label: 'Total Products',
            value: stats.totalProducts,
            color: 'text-blue-600',
            icon: '📦',
        },
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            color: 'text-purple-600',
            icon: '🛒',
        },
        {
            label: 'Total Customers',
            value: stats.totalUsers,
            color: 'text-green-600',
            icon: '👤',
        },
        {
            label: 'Pending Orders',
            value: stats.pendingOrders,
            color: 'text-yellow-600',
            icon: '⏳',
        },
        {
            label: 'Total Revenue',
            value: `৳${stats.totalRevenue.toLocaleString()}`,
            color: 'text-emerald-600',
            icon: '💰',
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-black mb-8">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                {cards.map((card) => (
                    <div key={card.label} className="glass rounded-3xl p-4 flex flex-col gap-2 text-black">
                        <span className="text-2xl">{card.icon}</span>
                        <p className="text-black/50 text-xs">{card.label}</p>
                        <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/products" className="glass rounded-3xl p-6 hover:border-black/20 transition">
                    <h3 className="text-black font-semibold mb-1">Manage Products</h3>
                    <p className="text-black/50 text-sm">Add, edit, delete products and update stock</p>
                </Link>
                <Link href="/admin/orders" className="glass rounded-3xl p-6 hover:border-black/20 transition">
                    <h3 className="text-black font-semibold mb-1">Manage Orders</h3>
                    <p className="text-black/50 text-sm">View and update customer order statuses</p>
                </Link>
            </div>
        </div>
    );
}