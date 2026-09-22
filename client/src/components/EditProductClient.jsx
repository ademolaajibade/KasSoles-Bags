"use client";

import { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import { apiFetch } from "@/lib/api";

export default function EditProductClient({ productId }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/products/id/${productId}`)
      .then((data) => setProduct(data.product))
      .catch((err) => setError(err.message));
  }, [productId]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <p>Loading...</p>;

  return <ProductForm product={product} />;
}
