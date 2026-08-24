"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Image from "next/image";

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const params = new URLSearchParams();


  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-gold/25">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:opacity-70 sm:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        <Link
          href="/"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-lg font-semibold tracking-tight sm:static sm:left-auto sm:top-auto sm:translate-x-0 sm:translate-y-0 sm:flex-row"
        >
          <Image
            src="/logo.jpeg"
            alt="logo"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <span className="mt-0.5 text-xs font-semibold leading-none sm:hidden">Kas</span>
          <span className="ml-2 hidden flex-col leading-tight sm:flex">
            <span>Kas</span>
            <span className="text-xs font-normal tracking-normal text-gray-500">
              Steps and Spread Shine
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link href="/products" className="hover:opacity-70">
            Shop
          </Link>
          <Link href="/products?gender=female" className="hover:opacity-70">
            Women
          </Link>
          <Link href="/products?gender=male" className="hover:opacity-70">
            Men
          </Link>
          <Link href="/contact" className="hover:opacity-70">
            Contact
          </Link>
        </nav>

        <Link href="/cart" className="relative flex h-9 w-9 items-center justify-center hover:opacity-70 sm:hidden" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6" />
            <circle cx="9.5" cy="20" r="1.25" fill="currentColor" stroke="none" />
            <circle cx="17.5" cy="20" r="1.25" fill="currentColor" stroke="none" />
          </svg>
          {cart.itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-black">
              {cart.itemCount}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-4 text-sm sm:flex">
          <Link href="/cart" className="hover:opacity-70">
            Cart{cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
          </Link>

          {user ? (
            <>
              <Link href="/account/wishlist" className="hover:opacity-70">
                Wishlist
              </Link>
              <Link href="/account/orders" className="hover:opacity-70">
                Orders
              </Link>
              <Link href="/account/profile" className="hover:opacity-70">
                Profile
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="hover:opacity-70">
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="hover:opacity-70">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:opacity-70">
                Login
              </Link>
              <Link href="/register" className="hover:opacity-70">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gold/25 px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/products" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
              Shop
            </Link>
            <Link href="/products?gender=female" className="hover:opacity-70" onClick={() =>{ setMenuOpen(false) 

            }}>
              Women
            </Link>
            <Link href="/products?gender=male" className="hover:opacity-70" onClick={() => {setMenuOpen(false);

            }}>
              Men
            </Link>
            <Link href="/contact" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>

            <div className="my-1 border-t border-gold/25" />

            {user ? (
              <>
                <Link href="/account/wishlist" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
                  Wishlist
                </Link>
                <Link href="/account/orders" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
                  Orders
                </Link>
                <Link href="/account/profile" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="text-left hover:opacity-70">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="hover:opacity-70" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
