"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

function ProfileForm({ user, onSaved }) {
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const data = await apiFetch("/auth/me", {
        method: "PUT",
        body: { name, phone },
      });
      setUser(data.user);
      onSaved(data.user);
      setStatus({ type: "success", message: "Profile updated" });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Could not update profile",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
        />
      </div>
      {status && (
        <p
          className={
            status.type === "error"
              ? "text-sm text-red-600"
              : "text-sm text-green-600"
          }
        >
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      await apiFetch("/auth/password", {
        method: "PUT",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setStatus({ type: "success", message: "Password updated" });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Could not update password",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-sm font-medium">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm font-medium">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rounded-md border border-gold/40 bg-transparent px-3 py-2"
        />
      </div>
      {status && (
        <p
          className={
            status.type === "error"
              ? "text-sm text-red-600"
              : "text-sm text-green-600"
          }
        >
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-full border border-gold px-6 py-2.5 text-sm font-medium hover:bg-gold/10 disabled:opacity-40"
      >
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

const EMPTY_ADDRESS = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  landmark: "",
};

function AddressBook({ addresses, onChange }) {
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiFetch("/auth/addresses", {
        method: "POST",
        body: form,
      });
      onChange(data.addresses);
      setForm(EMPTY_ADDRESS);
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Could not add address");
    }
  }

  async function handleDelete(addressId) {
    setBusyId(addressId);
    try {
      const data = await apiFetch(`/auth/addresses/${addressId}`, {
        method: "DELETE",
      });
      onChange(data.addresses);
    } catch (err) {
      setError(err.message || "Could not delete address");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetDefault(addressId) {
    setBusyId(addressId);
    try {
      const data = await apiFetch(`/auth/addresses/${addressId}`, {
        method: "PUT",
        body: { isDefault: true },
      });
      onChange(data.addresses);
    } catch (err) {
      setError(err.message || "Could not update address");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">
          No saved addresses.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {addresses.map((address) => (
          <li
            key={address._id}
            className="rounded-md border border-gold/40 p-4 text-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {address.label}{" "}
                  {address.isDefault && (
                    <span className="text-black/50 dark:text-white/50">
                      (default)
                    </span>
                  )}
                </p>
                <p>{address.fullName}</p>
                <p>{address.phone}</p>
                <p>
                  {address.street}, {address.city}, {address.state}
                </p>
                {address.landmark && <p>{address.landmark}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 text-xs">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    disabled={busyId === address._id}
                    className="underline hover:opacity-70 disabled:opacity-40"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(address._id)}
                  disabled={busyId === address._id}
                  className="text-red-600 underline hover:opacity-70 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-md border border-gold/40 p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Label (e.g. Home)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="col-span-2 rounded-md border border-gold/40 bg-transparent px-3 py-2 text-sm sm:col-span-1"
            />
            <input
              placeholder="Full name"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2 text-sm"
            />
            <input
              placeholder="Street"
              required
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="col-span-2 rounded-md border border-gold/40 bg-transparent px-3 py-2 text-sm"
            />
            <input
              placeholder="City"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2 text-sm"
            />
            <input
              placeholder="State"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="rounded-md border border-gold/40 bg-transparent px-3 py-2 text-sm"
            />
            <input
              placeholder="Landmark (optional)"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
              className="col-span-2 rounded-md border border-gold/40 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-full bg-gold px-5 py-2 text-xs font-medium text-black hover:opacity-90"
            >
              Save address
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs underline hover:opacity-70"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="self-start rounded-full border border-gold px-5 py-2 text-xs font-medium hover:bg-gold/10"
        >
          Add address
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setAddresses(user.addresses || []);
  }, [loading, user, router]);

  if (loading || !user || addresses === null) {
    return <div className="mx-auto max-w-2xl px-6 py-12">Loading…</div>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-12 px-6 py-12">
      <div>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Profile</h1>
        <ProfileForm user={user} onSaved={() => {}} />
      </div>

      <div>
        <h2 className="mb-6 text-lg font-semibold tracking-tight">Password</h2>
        <PasswordForm />
      </div>

      <div>
        <h2 className="mb-6 text-lg font-semibold tracking-tight">Addresses</h2>
        <AddressBook addresses={addresses} onChange={setAddresses} />
      </div>
    </div>
  );
}
