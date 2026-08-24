"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { apiFetch } from "@/lib/api";

function CategoriesAdmin() {
  const [categories, setCategories] = useState(null);
  const [form, setForm] = useState({ name: "", gender: "unisex" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    apiFetch("/categories")
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await apiFetch(`/categories/${editingId}`, {
          method: "PUT",
          body: form,
        });
      } else {
        await apiFetch("/categories", { method: "POST", body: form });
      }
      setForm({ name: "", gender: "unisex" });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(category) {
    setEditingId(category._id);
    setForm({ name: category.name, gender: category.gender });
  }

  async function handleDelete(id) {
    setError(null);
    try {
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/admin"
        className="mb-4 inline-block text-sm underline text-black/60 dark:text-white/60"
      >
        ← Back to Admin
      </Link>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Categories</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-10 flex flex-wrap items-end gap-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="gender" className="text-sm font-medium">
            Gender
          </label>
          <select
            id="gender"
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
          >
            <option value="unisex">Unisex</option>
            <option value="female">Women</option>
            <option value="male">Men</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-gold px-4 py-2 text-sm text-black hover:opacity-90"
        >
          {editingId ? "Save" : "Add category"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", gender: "unisex" });
            }}
            className="text-sm underline"
          >
            Cancel
          </button>
        )}
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {categories === null ? (
        <p>Loading…</p>
      ) : (
        <ul className="divide-y divide-gold/25">
          {categories.map((category) => (
            <li
              key={category._id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {category.gender}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => startEdit(category)}
                  className="underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category._id)}
                  className="text-red-600 underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminGuard>
      <CategoriesAdmin />
    </AdminGuard>
  );
}
