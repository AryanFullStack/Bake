"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";

export default function CustomCakePage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [requestNumber, setRequestNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form State for Multi-Step Wizard
  const [formData, setFormData] = useState({
    // Step 1: Customer Details
    full_name: "",
    phone: "",
    email: "",
    city: "Lahore",
    area: "",
    landmark: "",
    address: "",
    instructions: "",

    // Step 2: Cake Specs
    cake_type: "Celebration Cake",
    cake_size: "2 kg (Serves 12-15)",
    flavor: "Chocolate Fudge",
    quantity: "1",
    date: "",
    time: "14:00",
    budget: "",
    theme: "",
    cake_message: "",
    special_instructions: "",
  });

  // Image Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }
  }

  function removeImage(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function validateStep1() {
    if (!formData.full_name.trim()) return "Please enter your full name.";
    if (!formData.phone.trim()) return "Please enter your phone number.";
    if (!formData.city.trim()) return "Please enter your city.";
    if (!formData.area.trim()) return "Please enter your area/town.";
    if (!formData.address.trim()) return "Please enter your complete delivery address.";
    return null;
  }

  function validateStep2() {
    if (!formData.cake_type.trim()) return "Please select or type a cake type.";
    if (!formData.cake_size.trim()) return "Please specify the cake size or weight.";
    if (!formData.flavor.trim()) return "Please select a cake flavour.";
    if (!formData.date.trim()) return "Please select your preferred delivery date.";
    return null;
  }

  function goToStep2() {
    const err = validateStep1();
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage("");
    setCurrentStep(2);
  }

  function goToStep3() {
    const err = validateStep2();
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage("");
    setCurrentStep(3);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      selectedFiles.forEach((file) => {
        payload.append("images", file);
      });

      const response = await fetch("/api/custom-cake", {
        method: "POST",
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Could not submit custom cake request. Please check details.");
        return;
      }

      setRequestNumber(data.request_number);
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try submitting again.");
    }
  }

  if (requestNumber) {
    return (
      <div className="container-shell py-16 md:py-24">
        <div className="mx-auto max-w-xl rounded-[36px] bg-white p-8 sm:p-12 text-center shadow-xl border border-line/80">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green/10 text-green shadow-inner">
            <Check size={40} />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-green">
            Request Submitted Successfully
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-navy">
            We’ll Make It Special!
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted font-medium">
            Your custom cake request number is{" "}
            <strong className="text-navy font-extrabold text-base">{requestNumber}</strong>. Our cake design team is reviewing your brief and will prepare a tailored quotation shortly.
          </p>

          <div className="mt-8 rounded-2xl bg-cream p-5 border border-line/70 text-left text-xs space-y-2 text-navy">
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Request Reference:</span>
              <span className="font-extrabold text-orange">{requestNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Cake Flavour:</span>
              <span className="font-bold">{formData.flavor}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Target Delivery Date:</span>
              <span className="font-bold">{formData.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Status:</span>
              <span className="font-bold text-green">Under Review by Decorators</span>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/track-custom-cake?request=${requestNumber}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-lg hover:bg-orange-dark transition-all"
            >
              <span>Track Cake Request</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-line py-4 text-sm font-bold text-navy hover:border-orange transition-all"
            >
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-10 md:py-16">
      {/* Header Banner */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:items-start mb-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-extrabold text-orange border border-orange/20 mb-3">
            <Sparkles size={14} /> MADE AROUND YOUR MOMENT
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-navy">
            Your Dream Cake Starts Here.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted font-medium">
            Share the idea, date and delivery details. Our cake team will review it, send a custom quotation and guide you through the next step.
          </p>

          {/* 3 Step Story Highlights */}
          <div className="mt-8 grid gap-3 text-xs sm:text-sm font-bold text-navy">
            <div className={`flex items-center gap-3 rounded-2xl p-4 border transition-all ${currentStep === 1 ? "bg-white border-orange shadow-md" : "bg-white/60 border-line/70"}`}>
              <div className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-extrabold ${currentStep === 1 ? "bg-orange text-white" : "bg-cream-deep text-muted"}`}>
                1
              </div>
              <div>
                <p className="text-navy">Submit your brief and reference image</p>
                <p className="text-[11px] text-muted font-medium">Share contact, cake specs & design photos</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-2xl p-4 border transition-all ${currentStep === 2 ? "bg-white border-orange shadow-md" : "bg-white/60 border-line/70"}`}>
              <div className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-extrabold ${currentStep === 2 ? "bg-orange text-white" : "bg-cream-deep text-muted"}`}>
                2
              </div>
              <div>
                <p className="text-navy">Review our custom quotation</p>
                <p className="text-[11px] text-muted font-medium">Our decorators analyze your brief & pricing</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-2xl p-4 border transition-all ${currentStep === 3 ? "bg-white border-orange shadow-md" : "bg-white/60 border-line/70"}`}>
              <div className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-extrabold ${currentStep === 3 ? "bg-orange text-white" : "bg-cream-deep text-muted"}`}>
                3
              </div>
              <div>
                <p className="text-navy">Confirm production and delivery</p>
                <p className="text-[11px] text-muted font-medium">Fresh baking & temperature-controlled delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Step Form Container */}
        <div className="rounded-[32px] bg-white p-6 sm:p-10 border border-line/80 shadow-md">
          {/* Step Progress Tabs Bar */}
          <div className="flex items-center justify-between border-b border-line pb-6 mb-8 text-xs font-extrabold">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 transition-colors ${
                currentStep === 1 ? "text-orange" : "text-muted hover:text-navy"
              }`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${currentStep === 1 ? "bg-orange text-white" : "bg-cream-deep text-muted"}`}>
                1
              </span>
              <span>Contact & Location</span>
            </button>

            <ChevronRight size={16} className="text-muted" />

            <button
              onClick={() => {
                if (!validateStep1()) setCurrentStep(2);
              }}
              className={`flex items-center gap-2 transition-colors ${
                currentStep === 2 ? "text-orange" : "text-muted hover:text-navy"
              }`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${currentStep === 2 ? "bg-orange text-white" : "bg-cream-deep text-muted"}`}>
                2
              </span>
              <span>Cake Specs</span>
            </button>

            <ChevronRight size={16} className="text-muted" />

            <button
              onClick={() => {
                if (!validateStep1() && !validateStep2()) setCurrentStep(3);
              }}
              className={`flex items-center gap-2 transition-colors ${
                currentStep === 3 ? "text-orange" : "text-muted hover:text-navy"
              }`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${currentStep === 3 ? "bg-orange text-white" : "bg-cream-deep text-muted"}`}>
                3
              </span>
              <span>Upload & Submit</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage("")} className="text-red-700">
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: Contact & Location */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="border-b border-line pb-4">
                  <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
                    <User size={20} className="text-orange" /> Step 1: Tell us about yourself
                  </h2>
                  <p className="text-xs text-muted font-medium mt-1">
                    Where should we deliver your custom cake?
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Full Name <span className="text-orange">*</span>
                    <input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Sara Ahmed"
                      required
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Phone Number <span className="text-orange">*</span>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="03XX XXXXXXX"
                      required
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Email Address
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="sara@example.com"
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    City <span className="text-orange">*</span>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                    >
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Karachi">Karachi</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Area / Town <span className="text-orange">*</span>
                    <input
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="e.g. Gulberg, Model Town, Johar Town"
                      required
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Landmark
                    <input
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="e.g. Near Kalma Chowk"
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>
                </div>

                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  Complete Delivery Address <span className="text-orange">*</span>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="House number, street, block, sector..."
                    className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                  />
                </label>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="inline-flex items-center gap-2 rounded-2xl bg-orange px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/20 hover:bg-orange-dark transition-all"
                  >
                    <span>Next: Cake Details</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Cake Specifications */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="border-b border-line pb-4">
                  <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
                    <Cake size={20} className="text-orange" /> Step 2: Cake Specifications
                  </h2>
                  <p className="text-xs text-muted font-medium mt-1">
                    Describe your dream cake dimensions, flavours & preferences.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Cake Type / Event <span className="text-orange">*</span>
                    <input
                      name="cake_type"
                      value={formData.cake_type}
                      onChange={handleInputChange}
                      placeholder="e.g. Birthday, Nikah, Wedding, Baby Shower"
                      required
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Cake Size / Servings <span className="text-orange">*</span>
                    <select
                      name="cake_size"
                      value={formData.cake_size}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                    >
                      <option value="1 kg (Serves 6-8)">1 kg (Serves 6-8)</option>
                      <option value="2 kg (Serves 12-15)">2 kg (Serves 12-15)</option>
                      <option value="3 kg (Serves 20-25)">3 kg (Serves 20-25)</option>
                      <option value="2-Tier Celebration (5 kg+)">2-Tier Celebration (5 kg+)</option>
                      <option value="3-Tier Grand Wedding">3-Tier Grand Wedding</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Flavour Preference <span className="text-orange">*</span>
                    <select
                      name="flavor"
                      value={formData.flavor}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                    >
                      <option value="Signature Chocolate Fudge">Signature Chocolate Fudge</option>
                      <option value="Rose Vanilla Cream">Rose Vanilla Cream</option>
                      <option value="Red Velvet Cream Cheese">Red Velvet Cream Cheese</option>
                      <option value="Salted Caramel Sponge">Salted Caramel Sponge</option>
                      <option value="Mango Cream Tres Leches">Mango Cream Tres Leches</option>
                      <option value="Nutella Hazelnut Layer">Nutella Hazelnut Layer</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Target Delivery Date <span className="text-orange">*</span>
                    <input
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Target Delivery Time <span className="text-orange">*</span>
                    <input
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Estimated Budget (PKR)
                    <input
                      name="budget"
                      type="number"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                    />
                  </label>
                </div>

                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  Theme / Design Idea Description
                  <textarea
                    name="theme"
                    rows={2}
                    value={formData.theme}
                    onChange={handleInputChange}
                    placeholder="Colours, characters, mood, floral accents, gold leaf finish..."
                    className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  Message on Cake (e.g. "Happy 25th Birthday Ayesha")
                  <input
                    name="cake_message"
                    value={formData.cake_message}
                    onChange={handleInputChange}
                    placeholder="Text to write on cake plaque"
                    className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                  />
                </label>

                <div className="mt-6 flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-line px-6 py-4 text-sm font-bold text-navy hover:border-orange transition-all"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToStep3}
                    className="inline-flex items-center gap-2 rounded-2xl bg-orange px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/20 hover:bg-orange-dark transition-all"
                  >
                    <span>Next: References & Submit</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Reference Images & Review */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="border-b border-line pb-4">
                  <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
                    <ImageIcon size={20} className="text-orange" /> Step 3: Reference Photos & Review
                  </h2>
                  <p className="text-xs text-muted font-medium mt-1">
                    Upload reference cake photos and review your consultation brief.
                  </p>
                </div>

                {/* Drag-and-drop Image Upload Box */}
                <label className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-cream/40 p-8 text-center cursor-pointer hover:border-orange hover:bg-orange/5 transition-all">
                  <Upload size={32} className="text-orange" />
                  <span className="mt-3 text-sm font-bold text-navy">
                    Click or Drag Reference Photos Here
                  </span>
                  <span className="mt-1 text-xs text-muted font-medium">
                    Upload up to 5 PNG, JPG or WebP cake design inspiration photos
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageSelect}
                    className="sr-only"
                  />
                </label>

                {/* Image Previews */}
                {filePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {filePreviews.map((src, index) => (
                      <div key={index} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line">
                        <img src={src} alt="Reference preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-navy text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Card */}
                <div className="rounded-2xl bg-cream p-5 border border-line/80 text-xs space-y-2 text-navy">
                  <p className="font-bold text-sm text-navy border-b border-line pb-2 mb-2">
                    Brief Summary Confirmation:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted">Customer:</span> <strong>{formData.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Phone:</span> <strong>{formData.phone}</strong>
                    </div>
                    <div>
                      <span className="text-muted">City/Area:</span> <strong>{formData.city}, {formData.area}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Delivery Date:</span> <strong>{formData.date} ({formData.time})</strong>
                    </div>
                    <div>
                      <span className="text-muted">Flavour:</span> <strong>{formData.flavor}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Size:</span> <strong>{formData.cake_size}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-line px-6 py-4 text-sm font-bold text-navy hover:border-orange transition-all"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Specs</span>
                  </button>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/25 hover:bg-orange-dark transition-all disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      "Submitting Brief..."
                    ) : (
                      <>
                        <span>Submit Cake Request</span>
                        <Check size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
