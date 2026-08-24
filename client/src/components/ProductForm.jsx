"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

function toKobo(naira) {
  return Math.round(Number(naira) * 100);
}

function toNaira(kobo) {
  return kobo != null ? kobo / 100 : "";
}

function emptyVariant() {
  return { sku: "", size: "", color: "", price: "", stockQuantity: "" };
}

export default function ProductForm({ product }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category?._id || "");
  const [gender, setGender] = useState(product?.gender || "unisex");
  const [basePrice, setBasePrice] = useState(toNaira(product?.basePrice));
  const [compareAtPrice, setCompareAtPrice] = useState(
    toNaira(product?.compareAtPrice),
  );
  const [isHandmade, setIsHandmade] = useState(product?.isHandmade ?? true);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [variants, setVariants] = useState(
    product?.variants?.map((v) => ({ ...v, price: toNaira(v.price) })) || [
      emptyVariant(),
    ],
  );
  const [images, setImages] = useState(product?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/categories").then((data) => setCategories(data.categories));
  }, []);

  function updateVariant(index, field, value) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(index) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDeleteImage(publicId) {
    if (!isEdit) return;
    try {
      await apiFetch(`/products/${product._id}/images`, {
        method: "DELETE",
        body: { publicId },
      });
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = variants.map((v) => ({
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: toKobo(v.price),
        stockQuantity: Number(v.stockQuantity),
      }));

      const formData = new FormData();
      formData.set("name", name);
      formData.set("description", description);
      formData.set("category", category);
      formData.set("gender", gender);
      formData.set("basePrice", String(toKobo(basePrice)));
      formData.set(
        "compareAtPrice",
        compareAtPrice === "" ? "" : String(toKobo(compareAtPrice)),
      );
      formData.set("isHandmade", String(isHandmade));
      if (isEdit) formData.set("isActive", String(isActive));
      formData.set("variants", JSON.stringify(payload));
      newFiles.forEach((file) => formData.append("images", file));

      if (isEdit) {
        await apiFetch(`/products/${product._id}`, {
          method: "PUT",
          body: formData,
          isForm: true,
        });
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: formData,
          isForm: true,
        });
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="gender" className="text-sm font-medium">
            Gender
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          >
            <option value="unisex">Unisex</option>
            <option value="female">Women</option>
            <option value="male">Men</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="basePrice" className="text-sm font-medium">
            Base price (NGN)
          </label>
          <input
            id="basePrice"
            type="number"
            min="0"
            step="0.01"
            required
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-40 rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="compareAtPrice" className="text-sm font-medium">
            Compare-at price (NGN, optional)
          </label>
          <input
            id="compareAtPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Original price when on sale"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className="w-40 rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isHandmade}
            onChange={(e) => setIsHandmade(e.target.checked)}
          />
          Handmade
        </label>
        {isEdit && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Variants</p>
        <div className="flex flex-col gap-3">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-6 items-center gap-2">
              <input
                placeholder="SKU"
                required
                value={v.sku}
                onChange={(e) => updateVariant(i, "sku", e.target.value)}
                className="col-span-1 rounded-md border border-gold/40 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Size"
                required
                value={v.size}
                onChange={(e) => updateVariant(i, "size", e.target.value)}
                className="col-span-1 rounded-md border border-gold/40 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Color"
                required
                value={v.color}
                onChange={(e) => updateVariant(i, "color", e.target.value)}
                className="col-span-1 rounded-md border border-gold/40 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price (NGN)"
                required
                value={v.price}
                onChange={(e) => updateVariant(i, "price", e.target.value)}
                className="col-span-1 rounded-md border border-gold/40 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min="0"
                placeholder="Stock"
                required
                value={v.stockQuantity}
                onChange={(e) =>
                  updateVariant(i, "stockQuantity", e.target.value)
                }
                className="col-span-1 rounded-md border border-gold/40 bg-transparent px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                disabled={variants.length === 1}
                className="col-span-1 text-sm text-red-600 underline disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="mt-3 text-sm underline"
        >
          Add variant
        </button>
      </div>

      {isEdit && images.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Current images</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.publicId} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-20 w-20 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.publicId)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="images" className="text-sm font-medium">
          {isEdit ? "Add images" : "Images"}
        </label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewFiles(Array.from(e.target.files))}
          className="text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
