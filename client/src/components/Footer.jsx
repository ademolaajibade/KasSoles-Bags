import Link from "next/link";
import { siteInfo } from "@/lib/site";

const socialIcons = {
  Instagram: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.7L4.8 22H1.6l8.1-9.3L1 2h7l4.9 6.1L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z" />
    </svg>
  ),

};

export default function Footer() {
  return (
    <footer className="border-t border-gold/25 bg-footer-background text-footer-foreground">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">Kas</p>
            <p className="mt-2 max-w-xs text-sm text-footer-foreground/60">
              Handmade bags, shoes &amp; slippers, cut and stitched by hand in
              small batches.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Shop</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-footer-foreground/60">
              <li>
                <Link href="/products" className="hover:text-gold">
                  All products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?gender=female"
                  className="hover:text-gold"
                >
                  Women
                </Link>
              </li>
              <li>
                <Link href="/products?gender=male" className="hover:text-gold">
                  Men
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium">Account</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-footer-foreground/60">
              <li>
                <Link href="/account/orders" className="hover:text-gold">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/account/wishlist" className="hover:text-gold">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-gold">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium">Contact</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-footer-foreground/60">
              <li>{siteInfo.address}</li>
              <li>
                <a href={`tel:${siteInfo.phone}`} className="hover:text-gold">
                  {siteInfo.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteInfo.email}`}
                  className="hover:text-gold"
                >
                  {siteInfo.email}
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold">
                  Contact form
                </Link>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-4">
              {siteInfo.social.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="text-footer-foreground/60 hover:text-gold"
                >
                  {socialIcons[link.name]}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gold/25 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-footer-foreground/40">
            © {new Date().getFullYear()} Kas. Handmade bags, shoes &amp;
            slippers.
          </p>
          <div className="flex gap-4 text-xs text-footer-foreground/40">
            <Link href="/privacy" className="hover:text-gold">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold">
              Terms of Service
            </Link>
            <Link href="/returns" className="hover:text-gold">
              Returns &amp; Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
