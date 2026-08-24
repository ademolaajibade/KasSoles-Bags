"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/money";

function VerifyContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [state, setState] = useState({
    status: "loading",
    order: null,
    error: null,
  });

  useEffect(() => {
    if (!reference) {
      setState({
        status: "error",
        order: null,
        error: "Missing payment reference",
      });
      return;
    }

    const email =
      typeof window !== "undefined"
        ? sessionStorage.getItem("checkoutEmail")
        : null;
    const query = email ? `?email=${encodeURIComponent(email)}` : "";

    apiFetch(`/payments/verify/${reference}${query}`)
      .then((data) =>
        setState({ status: "done", order: data.order, error: null }),
      )
      .catch((err) =>
        setState({ status: "error", order: null, error: err.message }),
      );
  }, [reference]);

  if (state.status === "loading") {
    return <p>Confirming your payment…</p>;
  }

  if (state.status === "error") {
    return (
      <div>
        <p className="text-red-600">{state.error}</p>
        <Link href="/cart" className="mt-4 inline-block underline">
          Back to cart
        </Link>
      </div>
    );
  }

  const { order } = state;
  const paid = order.status === "paid";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {paid ? "Payment successful" : "Payment not completed"}
      </h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Order #{order._id.slice(-8).toUpperCase()} — {order.status}
      </p>
      <p className="mt-1 font-medium">{formatNaira(order.total)}</p>
      <Link href="/products" className="mt-6 inline-block underline">
        Continue shopping
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Suspense fallback={<p>Confirming your payment…</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
