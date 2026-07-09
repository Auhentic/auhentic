'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [navSearch, setNavSearch] = useState('');

    useEffect(() => {
        // get current user from API
        async function fetchUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch {
                // not logged in
            }
        }

        // get cart count from localStorage for guests
        function getCartCount() {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const total = cart.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(total);
        }

        fetchUser();
        getCartCount();

        // listen for cart updates
        window.addEventListener('cartUpdated', getCartCount);
        return () => window.removeEventListener('cartUpdated', getCartCount);
    }, []);

    function handleSearch(e) {
        e.preventDefault();
        if (!navSearch.trim()) return;
        router.push(`/products?search=${encodeURIComponent(navSearch.trim())}`);
        setNavSearch('');
        setMenuOpen(false);
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/auth/login');
        router.refresh();
    }

    return (
        <nav className="w-full sticky top-0 z-50 glass border-b border-black/10">
            {/* Main Desktop Flex Container */}
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <Image
                        src="/Logo.png"
                        alt="Auhentic"
                        width={140}
                        height={40}
                        priority
                        className="h-19 w-auto object-contain"
                        style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(50%) saturate(1000%) hue-rotate(340deg)' }}
                    />
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-black/70 hover:text-black transition text-sm">
                        Home
                    </Link>
                    <Link href="/products" className="text-black/70 hover:text-black transition text-sm">
                        Products
                    </Link>
                    {user && (
                        <Link href="/orders" className="text-black/70 hover:text-black transition text-sm">
                            My Orders
                        </Link>
                    )}
                    {user?.role === 'admin' && (
                        <Link href="/admin" className="text-[#3E2723] hover:text-[#2A1A17] transition text-sm font-medium">
                            Admin
                        </Link>
                    )}
                </div>

                {/* Desktop Search */}
                <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
                    <input
                        type="text"
                        value={navSearch}
                        onChange={(e) => setNavSearch(e.target.value)}
                        placeholder="Search products..."
                        className="glass-input text-sm rounded-full px-4 py-2 w-52 focus:w-64 transition-all duration-300"
                    />
                    <button type="submit" className="text-black/60 hover:text-black transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                    </button>
                </form>

                {/* Desktop Right Side */}
                <div className="hidden md:flex items-center gap-4">

                    {/* Cart */}
                    <Link href="/cart" className="relative text-black/70 hover:text-black transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Auth */}
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-black/60 text-sm">Hi, {user.name.split(' ')[0]}</span>
                            <Link
                                href="/profile"
                                className="text-black/70 hover:text-black transition text-sm"
                            >
                                Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="glass-btn text-black text-sm px-4 py-2 w-auto rounded-md hover:rounded-xl transition-all duration-500"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/auth/login" className="glass-btn text-black text-sm px-4 py-2 w-auto text-center rounded-md hover:rounded-xl transition-all duration-500">
                                Login
                            </Link>
                            <Link href="/auth/register" className="glass-btn-primary text-black text-sm px-4 py-2 w-auto text-center rounded-md hover:rounded-xl transition-all duration-500">
                                Register
                            </Link>
                        </div>
                    )}

                </div>

                {/* Mobile Right Side — Cart + Hamburger */}
                <div className="flex md:hidden items-center gap-4">

                    {/* Cart */}
                    <Link href="/cart" className="relative text-black/70 hover:text-black transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Hamburger Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-black/70 hover:text-black transition"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? (
                            // X icon
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            // Hamburger icon
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="md:hidden glass border-t border-black/10 px-4 py-4 flex flex-col gap-4">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={navSearch}
                            onChange={(e) => setNavSearch(e.target.value)}
                            placeholder="Search products..."
                            className="glass-input text-sm rounded-full px-4 py-2 flex-1"
                        />
                        <button type="submit" className="text-black/60 hover:text-black transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                        </button>
                    </form>
                    <Link
                        href="/"
                        onClick={() => setMenuOpen(false)}
                        className="text-black/70 hover:text-black transition text-sm"
                    >
                        Home
                    </Link>
                    <Link
                        href="/products"
                        onClick={() => setMenuOpen(false)}
                        className="text-black/70 hover:text-black transition text-sm"
                    >
                        Products
                    </Link>
                    {user && (
                        <Link
                            href="/orders"
                            onClick={() => setMenuOpen(false)}
                            className="text-black/70 hover:text-black transition text-sm"
                        >
                            My Orders
                        </Link>
                    )}
                    {user?.role === 'admin' && (
                        <Link
                            href="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="text-[#3E2723] text-sm font-medium"
                        >
                            Admin
                        </Link>
                    )}

                    <div className="border-t border-black/10 pt-4">
                        {user ? (
                            <div className="flex flex-col gap-3">
                                <span className="text-black/60 text-sm">Hi, {user.name.split(' ')[0]}</span>
                                <Link
                                    href="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className="text-black/70 hover:text-black transition text-sm"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="glass-btn text-black text-sm px-4 py-2 w-full rounded-md hover:rounded-3xl transition-all duration-500"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/auth/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="glass-btn text-black text-sm px-4 py-2 w-full text-center rounded-md hover:rounded-xl transition-all duration-500"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="glass-btn-primary text-black text-sm px-4 py-2 w-full text-center rounded-md hover:rounded-xl transition-all duration-500"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}