import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Admin</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Link
            href="/admin/categories"
            className="rounded-lg border border-gold/10 p-6 hover:bg-gold/10"
          >
            Categories
          </Link>
          <Link
            href="/admin/products"
            className="rounded-lg border border-gold/10 p-6 hover:bg-gold/10"
          >
            Products
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-lg border border-gold/10 p-6 hover:bg-gold/10"
          >
            Orders
          </Link>
          <Link
            href="/admin/reviews"
            className="rounded-lg border border-gold/10 p-6 hover:bg-gold/10"
          >
            Reviews
          </Link>
        </div>
      </div>
    </AdminGuard>
  );
}
