import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import EditProductClient from "@/components/EditProductClient";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return (
    <AdminGuard>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/admin/products"
          className="mb-4 inline-block text-sm underline text-black/60 dark:text-white/60"
        >
          ← Back to Products
        </Link>
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          Edit product
        </h1>
        <EditProductClient productId={id} />
      </div>
    </AdminGuard>
  );
}
