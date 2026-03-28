'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-red-900 text-white shadow-lg sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-yellow-300">
          BarItalia STL
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/" className="hover:text-yellow-300 transition">
            Home
          </Link>
          <Link href="/menu" className="hover:text-yellow-300 transition">
            Menu
          </Link>
          <Link href="/reservations" className="hover:text-yellow-300 transition">
            Reservations
          </Link>
          <Link href="/about" className="hover:text-yellow-300 transition">
            About
          </Link>
          <Link href="/contact" className="hover:text-yellow-300 transition">
            Contact
          </Link>
          <a
            href="tel:+13145551234"
            className="bg-yellow-400 text-red-900 font-bold px-6 py-2 rounded hover:bg-yellow-300 transition"
          >
            Call Now
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-red-800 px-4 py-4 space-y-4">
          <Link href="/" className="block hover:text-yellow-300">Home</Link>
          <Link href="/menu" className="block hover:text-yellow-300">Menu</Link>
          <Link href="/reservations" className="block hover:text-yellow-300">Reservations</Link>
          <Link href="/about" className="block hover:text-yellow-300">About</Link>
          <Link href="/contact" className="block hover:text-yellow-300">Contact</Link>
          <a href="tel:+13145551234" className="block bg-yellow-400 text-red-900 font-bold px-4 py-2 rounded text-center">
            Call Now
          </a>
        </div>
      )}
    </header>
  );
}
