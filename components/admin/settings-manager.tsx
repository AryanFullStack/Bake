"use client";

import { FormEvent, useState } from "react";
import { Cake, Check, Image as ImageIcon, Plus, Save, Settings, ShieldCheck, Sparkles } from "lucide-react";

export function SettingsManager({
  initialSettings,
  initialBanners,
  initialFaqs,
}: {
  initialSettings: any;
  initialBanners: any[];
  initialFaqs: any[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [banners, setBanners] = useState(initialBanners);
  const [faqs, setFaqs] = useState(initialFaqs);
  const [savedNotice, setSavedNotice] = useState("");

  async function saveSetting(event: FormEvent<HTMLFormElement>, key: string) {
    event.preventDefault();
    const raw: any = Object.fromEntries(new FormData(event.currentTarget).entries());
    const value =
      key === "delivery"
        ? {
            ...raw,
            free_threshold: Number(raw.free_threshold),
            fee: Number(raw.fee),
            cities: String(raw.cities ?? "")
              .split(",")
              .map((city) => city.trim())
              .filter(Boolean),
          }
        : raw;

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "setting", key, value }),
    });

    if (response.ok) {
      setSettings({ ...settings, [key]: value });
      setSavedNotice(`${key === "store" ? "Store Info" : "Delivery Settings"} saved successfully!`);
      setTimeout(() => setSavedNotice(""), 3000);
    }
  }

  async function add(event: FormEvent<HTMLFormElement>, entity: "banner" | "faq") {
    event.preventDefault();
    const form = event.currentTarget;
    const value: any = Object.fromEntries(new FormData(form).entries());
    value.entity = entity;
    value.is_active = value.is_active === "true";
    value.is_published = value.is_published === "true";

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (response.ok) {
      setSavedNotice(`New ${entity} published to database!`);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  const store = settings.store ?? {};
  const delivery = settings.delivery ?? {};

  return (
    <div className="p-4 sm:p-6 md:p-10 flex flex-col gap-8 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-orange">
          System Administration
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-navy">
          Site Settings & Banner Manager
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted font-medium">
          Manage homepage hero banners, store information, delivery fees, and FAQ entries directly from Supabase.
        </p>
      </div>

      {savedNotice && (
        <div className="rounded-2xl bg-green/10 p-4 border border-green/20 text-xs font-bold text-green flex items-center gap-2 animate-fade-in">
          <Check size={16} /> {savedNotice}
        </div>
      )}

      {/* Grid Settings Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Store Info Form */}
        <form
          onSubmit={(event) => saveSetting(event, "store")}
          className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs flex flex-col justify-between"
        >
          <div>
            <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
              <Settings size={20} className="text-orange" /> Store Information
            </h2>
            <div className="mt-5 grid gap-4">
              <Field name="name" label="Store Name" defaultValue={store.name} />
              <Field name="email" label="Contact Email" defaultValue={store.email} />
              <Field name="phone" label="Hotline Phone" defaultValue={store.phone} />
              <Field name="city" label="Headquarters City" defaultValue={store.city} />
            </div>
          </div>
          <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 px-6 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition-all">
            <Save size={16} /> Save Store Details
          </button>
        </form>

        {/* Delivery Settings Form */}
        <form
          onSubmit={(event) => saveSetting(event, "delivery")}
          className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs flex flex-col justify-between"
        >
          <div>
            <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green" /> Delivery Configurations
            </h2>
            <div className="mt-5 grid gap-4">
              <Field
                name="free_threshold"
                label="Free Shipping Threshold (PKR)"
                defaultValue={delivery.free_threshold}
                type="number"
              />
              <Field
                name="fee"
                label="Standard Shipping Fee (PKR)"
                defaultValue={delivery.fee}
                type="number"
              />
              <Field
                name="same_day_cutoff"
                label="Same-Day Order Cutoff Time"
                defaultValue={delivery.same_day_cutoff}
              />
              <Field
                name="cities"
                label="Supported Delivery Cities (Comma Separated)"
                defaultValue={(delivery.cities ?? []).join(", ")}
              />
            </div>
          </div>
          <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 px-6 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition-all">
            <Save size={16} /> Save Delivery Rules
          </button>
        </form>

        {/* Hero Banner Manager */}
        <section className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs lg:col-span-2">
          <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-orange" /> Homepage Hero Banner Manager
          </h2>
          <p className="mt-2 text-xs text-muted font-medium">
            Active banners dynamically control the main homepage hero slider.
          </p>

          {/* Active Banners List */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="flex items-center justify-between rounded-2xl bg-cream p-4 border border-line/70"
              >
                <div>
                  <p className="font-bold text-navy text-sm">{banner.title}</p>
                  <p className="text-xs text-muted truncate max-w-xs">{banner.body}</p>
                </div>
                <span
                  className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                    banner.is_active ? "bg-green/10 text-green" : "bg-cream-deep text-muted"
                  }`}
                >
                  {banner.is_active ? "Active on Homepage" : "Draft"}
                </span>
              </div>
            ))}
          </div>

          {/* Add New Banner Form */}
          <form onSubmit={(event) => add(event, "banner")} className="mt-6 grid gap-4 border-t border-line pt-6">
            <h3 className="font-bold text-navy text-base">Add New Hero Banner</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="title" label="Banner Headline Title" placeholder="e.g. Fresh Artisan Croissants" required />
              <Field name="body" label="Subtitle Description" placeholder="e.g. Baked fresh every morning with pure butter" />
              <Field
                name="image_path"
                label="Image Unsplash URL or Storage Path"
                placeholder="https://images.unsplash.com/..."
                required
              />
              <Field name="cta_label" label="CTA Button Label" placeholder="e.g. Shop Fresh Bakes" />
              <Field name="cta_href" label="CTA Target URL Path" placeholder="/shop" />
              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                Publish Status
                <select
                  name="is_active"
                  defaultValue="true"
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none"
                >
                  <option value="true font-bold">Active (Show on Homepage)</option>
                  <option value="false">Draft (Hide)</option>
                </select>
              </label>
            </div>
            <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 px-6 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition-all w-fit">
              <Plus size={16} /> Publish Hero Banner
            </button>
          </form>
        </section>

        {/* FAQ Manager */}
        <section className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs lg:col-span-2">
          <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-orange" /> Frequently Asked Questions (FAQ) Manager
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-2xl bg-cream p-4 border border-line/70">
                <p className="font-bold text-navy text-sm">{faq.question}</p>
                <p className="mt-1 text-xs text-muted line-clamp-2">{faq.answer}</p>
              </div>
            ))}
          </div>

          <form onSubmit={(event) => add(event, "faq")} className="mt-6 grid gap-4 border-t border-line pt-6">
            <h3 className="font-bold text-navy text-base">Add New FAQ Item</h3>
            <Field name="question" label="Question" required />
            <label className="block text-xs font-bold uppercase tracking-wider text-navy">
              Answer
              <textarea
                name="answer"
                rows={3}
                required
                className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
              />
            </label>
            <input type="hidden" name="is_published" value="true" />
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 px-6 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition-all w-fit">
              <Plus size={16} /> Add Published FAQ
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
      {label} {required && <span className="text-orange">*</span>}
      <input
        name={name}
        defaultValue={defaultValue}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors"
      />
    </label>
  );
}
