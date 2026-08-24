import OrderDetailClient from "@/components/OrderDetailClient";

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <OrderDetailClient orderId={id} />
    </div>
  );
}
