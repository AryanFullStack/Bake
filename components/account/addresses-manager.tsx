"use client";

import { FormEvent, useState } from "react";
import { Edit2, Home, MapPin, Plus, Star, Trash2, Building, Compass } from "lucide-react";
import { PAKISTAN_CITIES, OTHER_CITY_OPTION, getCitySelectionState } from "@/lib/cities";

export type AddressItem = {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  landmark?: string | null;
  instructions?: string | null;
  is_default: boolean;
};

export function AddressesManager({ initialAddresses }: { initialAddresses: AddressItem[] }) {
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(initialAddresses.length === 0);
  const [labelChoice, setLabelChoice] = useState("Home");
  const [citySelect, setCitySelect] = useState("Lahore");
  const [customCity, setCustomCity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function startEdit(addr: AddressItem) {
    setEditingAddress(addr);
    setLabelChoice(addr.label || "Home");
    const { selectValue, customCity: cust } = getCitySelectionState(addr.city || "");
    setCitySelect(selectValue);
    setCustomCity(cust);
    setIsFormOpen(true);
  }

  function startNew() {
    setEditingAddress(null);
    setLabelChoice("Home");
    setCitySelect("Lahore");
    setCustomCity("");
    setIsFormOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const resolvedCity = citySelect === OTHER_CITY_OPTION ? customCity.trim() : citySelect.trim();

    if (!resolvedCity) {
      setStatus("error");
      setErrorMessage("Please select or enter a city.");
      return;
    }

    const data: Record<string, any> = {
      label: labelChoice || (formData.get("label") as string) || "Home",
      full_name: formData.get("full_name"),
      phone: formData.get("phone"),
      city: resolvedCity,
      area: formData.get("area"),
      address: formData.get("address"),
      landmark: formData.get("landmark") || "",
      instructions: formData.get("instructions") || "",
      is_default: formData.get("is_default") === "on",
    };

    if (editingAddress) {
      data.id = editingAddress.id;
    }

    try {
      const response = await fetch("/api/addresses", {
        method: editingAddress ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const res = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(res.error || "Failed to save address.");
        return;
      }

      // Re-fetch addresses list
      const fetchRes = await fetch("/api/addresses");
      if (fetchRes.ok) {
        const refreshed = await fetchRes.json();
        setAddresses(refreshed.addresses ?? []);
      }

      setStatus("idle");
      setEditingAddress(null);
      setIsFormOpen(false);
    } catch {
      setStatus("error");
      setErrorMessage("Network error while saving address.");
    }
  }

  async function handleSetDefault(id: string) {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;

    try {
      const response = await fetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, is_default: true }),
      });

      if (response.ok) {
        const fetchRes = await fetch("/api/addresses");
        if (fetchRes.ok) {
          const refreshed = await fetchRes.json();
          setAddresses(refreshed.addresses ?? []);
        }
      }
    } catch (e) {
      console.error("Failed to set default address", e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this saved address?")) return;

    try {
      const response = await fetch("/api/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete address", e);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-start">
      {/* Left Side: Address List */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">My Saved Address</h2>
            <p className="text-xs text-muted font-medium">Manage your delivery address for fast checkout.</p>
          </div>
          {!isFormOpen && (
            <button
              onClick={startNew}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark transition-all cursor-pointer"
            >
              <Plus size={15} /> Add New Address
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative flex flex-col gap-3 rounded-[24px] bg-white p-6 border transition-all ${
                addr.is_default
                  ? "border-orange/60 shadow-md ring-1 ring-orange/30"
                  : "border-line/80 shadow-xs hover:border-navy/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep px-3 py-1 text-xs font-extrabold text-navy border border-line">
                    {addr.label === "Home" ? (
                      <Home size={12} />
                    ) : addr.label === "Office" ? (
                      <Building size={12} />
                    ) : (
                      <Compass size={12} />
                    )}
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-[11px] font-extrabold text-green border border-green/20">
                      <Star size={10} className="fill-green" /> Default Address
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-orange hover:underline cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(addr)}
                    className="p-2 text-muted hover:text-navy transition-colors cursor-pointer"
                    aria-label="Edit address"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 text-muted hover:text-red-500 transition-colors cursor-pointer"
                    aria-label="Delete address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <p className="font-bold text-navy text-base">{addr.full_name}</p>
                <p className="text-xs font-semibold text-muted">{addr.phone}</p>
                <p className="mt-2 text-sm text-navy/90 font-medium leading-relaxed">
                  {addr.address}, {addr.area}, {addr.city}
                </p>
                {addr.landmark && (
                  <p className="mt-1 text-xs text-muted font-medium">
                    <strong className="text-navy">Landmark:</strong> {addr.landmark}
                  </p>
                )}
                {addr.instructions && (
                  <p className="mt-1 text-xs text-muted font-medium italic bg-cream/50 p-2 rounded-xl border border-line/50">
                    "{addr.instructions}"
                  </p>
                )}
              </div>
            </div>
          ))}

          {addresses.length === 0 && !isFormOpen && (
            <div className="rounded-[28px] bg-white p-10 text-center border border-line/80 shadow-xs">
              <MapPin size={32} className="mx-auto text-muted mb-2" />
              <p className="text-sm font-bold text-navy">No saved address yet.</p>
              <p className="mt-1 text-xs text-muted font-medium">
                Add your delivery address to enable fast checkout.
              </p>
              <button
                onClick={startNew}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark transition-all cursor-pointer"
              >
                <Plus size={14} /> Add Address
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Right Side: Add / Edit Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="rounded-[28px] bg-white p-6 sm:p-7 border border-line/80 shadow-lg sticky top-24"
        >
          <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
            <h3 className="font-display text-xl font-bold text-navy">
              {editingAddress ? "Edit Saved Address" : "Add New Address"}
            </h3>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-xs font-bold text-muted hover:text-navy cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Address Label Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-2">
                Address Label
              </label>
              <div className="flex gap-2">
                {["Home", "Office", "Other"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setLabelChoice(tag)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      labelChoice === tag
                        ? "border-orange bg-orange/10 text-orange shadow-xs"
                        : "border-line bg-cream/30 text-navy hover:border-navy/30"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Recipient Name <span className="text-orange">*</span>
              <input
                name="full_name"
                defaultValue={editingAddress?.full_name || ""}
                required
                placeholder="Ahmed Khan"
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Phone Number <span className="text-orange">*</span>
              <input
                name="phone"
                type="tel"
                defaultValue={editingAddress?.phone || ""}
                required
                placeholder="0300XXXXXXX"
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                City <span className="text-orange">*</span>
                <select
                  value={citySelect}
                  onChange={(e) => setCitySelect(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                Area / Town <span className="text-orange">*</span>
                <input
                  name="area"
                  defaultValue={editingAddress?.area || ""}
                  required
                  placeholder="e.g. Mandian, Gulberg III"
                  className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white"
                />
              </label>
            </div>

            {/* Custom City field if "Other / Enter City" is selected */}
            {citySelect === OTHER_CITY_OPTION && (
              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                Enter Custom City Name <span className="text-orange">*</span>
                <input
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  required
                  placeholder="Enter your city (e.g. Hunza...)"
                  className="mt-1.5 w-full rounded-xl border border-orange/60 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange"
                />
              </label>
            )}

            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Street Address <span className="text-orange">*</span>
              <textarea
                name="address"
                rows={3}
                defaultValue={editingAddress?.address || ""}
                required
                placeholder="House #, Street #, Block..."
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-orange focus:bg-white"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Landmark (Optional)
              <input
                name="landmark"
                defaultValue={editingAddress?.landmark || ""}
                placeholder="e.g. Main Market"
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-orange focus:bg-white"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Delivery Instructions (Optional)
              <input
                name="instructions"
                defaultValue={editingAddress?.instructions || ""}
                placeholder="e.g. Call before arrival"
                className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-orange focus:bg-white"
              />
            </label>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="is_default"
                defaultChecked={editingAddress?.is_default ?? addresses.length === 0}
                className="h-4 w-4 rounded border-line text-orange focus:ring-orange"
              />
              <span className="text-xs font-bold text-navy">Set as default delivery address</span>
            </label>
          </div>

          {status === "error" && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 w-full rounded-2xl bg-orange py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-orange-dark transition-all disabled:opacity-60 cursor-pointer"
          >
            {status === "loading" ? "Saving Address..." : editingAddress ? "Update Address" : "Save Address"}
          </button>
        </form>
      )}
    </div>
  );
}
