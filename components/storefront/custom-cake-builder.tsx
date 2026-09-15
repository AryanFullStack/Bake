"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  Check,
  Clock,
  FileText,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Upload,
  User,
  X,
  ShieldCheck,
  Copy,
  ExternalLink,
} from "lucide-react";

export function CustomCakeBuilder() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [step3Ready, setStep3Ready] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Debounce step 3 readiness to prevent in-flight click bleed from Step 2 "Next Step"
  useEffect(() => {
    if (currentStep === 3) {
      const timer = setTimeout(() => {
        setStep3Ready(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setStep3Ready(false);
    }
  }, [currentStep]);

  // Form State for Multi-Step Wizard
  const [formData, setFormData] = useState({
    // Step 1: Contact & Delivery
    full_name: "",
    phone: "",
    email: "",
    city: "Karachi",
    area: "",
    landmark: "",
    address: "",
    instructions: "",

    // Step 2: Cake Specifications
    cake_type: "Celebration Cake",
    cake_size: "2 kg / 4.5 lbs (Serves 12-15)",
    flavor: "Signature Chocolate Fudge",
    filling: "Rich Chocolate Ganache",
    shape: "Classic Round",
    tiers: "Single Tier",
    dietary_requirements: "Standard (Contains Dairy & Eggs)",
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

  function isSupportedImage(file: File) {
    if (!file) return false;
    const type = (file.type || "").toLowerCase();
    if (type.startsWith("image/")) return true;
    const ext = (file.name || "").toLowerCase().split(".").pop() || "";
    return ["jpg", "jpeg", "png", "webp", "jfif", "pjpeg", "heic", "heif", "avif", "gif"].includes(ext);
  }

  function addFiles(filesArray: File[]) {
    const valid = filesArray.filter(isSupportedImage);
    if (valid.length !== filesArray.length) {
      setErrorMessage("Some files were not recognized as images. Please select JPG, PNG, or WebP.");
    } else {
      setErrorMessage("");
    }

    const combined = [...selectedFiles, ...valid].slice(0, 5);
    setSelectedFiles(combined);

    const newPreviews = combined.map((file) => URL.createObjectURL(file));
    setFilePreviews(newPreviews);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function validateStep1(): boolean {
    if (!formData.full_name.trim()) {
      setErrorMessage("Please enter your full name.");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid phone number (at least 10 digits).");
      return false;
    }
    if (!formData.city.trim()) {
      setErrorMessage("Please specify your delivery city.");
      return false;
    }
    if (!formData.area.trim()) {
      setErrorMessage("Please specify your town / area (e.g. Clifton, Gulshan, DHA).");
      return false;
    }
    if (!formData.address.trim()) {
      setErrorMessage("Please enter your complete delivery street address.");
      return false;
    }
    setErrorMessage("");
    return true;
  }

  function validateStep2(): boolean {
    if (!formData.cake_type.trim()) {
      setErrorMessage("Please choose a cake type.");
      return false;
    }
    if (!formData.cake_size.trim()) {
      setErrorMessage("Please choose cake size / weight.");
      return false;
    }
    if (!formData.flavor.trim()) {
      setErrorMessage("Please specify a preferred flavour.");
      return false;
    }
    if (!formData.date.trim()) {
      setErrorMessage("Please select your preferred delivery date.");
      return false;
    }
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setErrorMessage("Delivery date cannot be in the past.");
      return false;
    }
    setErrorMessage("");
    return true;
  }

  function nextStep() {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      if (typeof window !== "undefined") {
        document.getElementById("custom-cake-wizard-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      if (typeof window !== "undefined") {
        document.getElementById("custom-cake-wizard-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function prevStep() {
    setErrorMessage("");
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
    if (typeof window !== "undefined") {
      document.getElementById("custom-cake-wizard-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
      // Block accidental enter submissions
    }
  }

  async function handleFinalSubmit() {
    if (currentStep !== 3 || !step3Ready) {
      return;
    }

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const data = new FormData();
      // Contact & Delivery
      data.append("full_name", formData.full_name);
      data.append("phone", formData.phone);
      data.append("email", formData.email);
      data.append("city", formData.city);
      data.append("area", formData.area);
      data.append("landmark", formData.landmark);
      data.append("address", formData.address);
      data.append("instructions", formData.instructions);

      // Cake Specs
      data.append("cake_type", formData.cake_type);
      data.append("cake_size", formData.cake_size);
      data.append("flavor", formData.flavor);
      data.append("filling", formData.filling);
      data.append("shape", formData.shape);
      data.append("tiers", formData.tiers);
      data.append("dietary_requirements", formData.dietary_requirements);
      data.append("quantity", formData.quantity);
      data.append("preferred_delivery_date", formData.date);
      data.append("preferred_delivery_time", formData.time);
      data.append("budget", formData.budget);
      data.append("theme", formData.theme);
      data.append("cake_message", formData.cake_message);
      data.append("special_instructions", formData.special_instructions);

      // Images
      selectedFiles.forEach((file) => {
        data.append("images", file);
      });

      const res = await fetch("/api/custom-cake", {
        method: "POST",
        body: data,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to submit custom cake brief.");
      }

      setRequestNumber(json.request_number);
      setStatus("idle");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  }

  function copyTrackingLink() {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/track-custom-cake?request=${requestNumber}&phone=${encodeURIComponent(formData.phone)}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // Success Confirmation View
  if (requestNumber) {
    return (
      <div className="container-shell py-12 md:py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 sm:p-10 border border-line/80 shadow-xl text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-500/10 text-green-600 border border-green-500/20 shadow-inner">
            <Check size={40} className="stroke-[2.5]" />
          </div>

          <span className="mt-6 inline-block rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-orange uppercase">
            Brief Received & Confirmed
          </span>

          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-navy">
            Your Custom Cake Request is Submitted!
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
            Thank you, <strong className="text-navy">{formData.full_name}</strong>! Our master cake decorators have received your brief and design specifications.
          </p>

          {/* Reference Card */}
          <div className="mt-6 rounded-2xl bg-cream/60 p-5 border border-line text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Request Reference Number</p>
                <p className="font-mono text-2xl font-extrabold text-navy tracking-tight mt-0.5">{requestNumber}</p>
              </div>
              <button
                type="button"
                onClick={copyTrackingLink}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-navy border border-line shadow-sm hover:border-orange hover:text-orange transition-all"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-line/60 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted font-medium">Flavour & Tiers:</span>
                <p className="font-bold text-navy">{formData.flavor} • {formData.tiers}</p>
              </div>
              <div>
                <span className="text-muted font-medium">Target Delivery:</span>
                <p className="font-bold text-navy">{formData.date} ({formData.time})</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-blue-50/70 p-4 border border-blue-100 text-left text-xs text-blue-900 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className="shrink-0 text-blue-600 mt-0.5" />
              <p>
                <strong>What happens next?</strong> Our design team will review your specs, verify ingredient availability, and calculate an itemized price quotation. You can monitor the progress anytime using our 11-step visual tracker.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/track-custom-cake?request=${requestNumber}&phone=${encodeURIComponent(formData.phone)}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 px-6 text-sm font-extrabold text-white shadow-lg shadow-orange/20 hover:bg-orange-dark transition-all"
            >
              <span>Track Live Status</span>
              <ExternalLink size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-line py-3.5 px-6 text-sm font-bold text-navy hover:border-orange transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-10 md:py-16">
      {/* Header Banner */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start mb-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-extrabold text-orange border border-orange/20 mb-3">
            <Sparkles size={14} /> BESPOKE CAKES & CELEBRATIONS
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-navy">
            Custom Cake Studio
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted font-medium">
            Design and order bespoke celebration cakes handcrafted to your exact taste, shape, flavours, and theme.
            Share your requirements, upload design photos, and monitor your custom order from decorator consultation to delivery.
          </p>

          {/* 3-Step Wizard Roadmap */}
          <div className="mt-8 grid gap-3 text-xs sm:text-sm font-bold text-navy">
            <div
              className={`flex items-center gap-3.5 rounded-2xl p-4 border transition-all ${
                currentStep === 1 ? "bg-white border-orange shadow-md ring-2 ring-orange/10" : "bg-white/60 border-line/70"
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                  currentStep === 1 ? "bg-orange text-white" : "bg-cream-deep text-muted"
                }`}
              >
                1
              </div>
              <div>
                <p className="text-navy font-bold">Contact & Delivery Information</p>
                <p className="text-[11px] text-muted font-medium">Your contact details, destination address, and area</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3.5 rounded-2xl p-4 border transition-all ${
                currentStep === 2 ? "bg-white border-orange shadow-md ring-2 ring-orange/10" : "bg-white/60 border-line/70"
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                  currentStep === 2 ? "bg-orange text-white" : "bg-cream-deep text-muted"
                }`}
              >
                2
              </div>
              <div>
                <p className="text-navy font-bold">Cake Specifications & Flavours</p>
                <p className="text-[11px] text-muted font-medium">Flavours, fillings, tiers, shape, occasion, and dietary requirements</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3.5 rounded-2xl p-4 border transition-all ${
                currentStep === 3 ? "bg-white border-orange shadow-md ring-2 ring-orange/10" : "bg-white/60 border-line/70"
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                  currentStep === 3 ? "bg-orange text-white" : "bg-cream-deep text-muted"
                }`}
              >
                3
              </div>
              <div>
                <p className="text-navy font-bold">Reference Photos & Submission</p>
                <p className="text-[11px] text-muted font-medium">Upload sample photos, review brief summary, and submit</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream/70 p-4 border border-line/60 text-xs text-muted">
            <ShieldCheck size={18} className="shrink-0 text-orange" />
            <span>No upfront payment required until our team approves your design and prepares an itemized quotation.</span>
          </div>
        </div>

        {/* Wizard Form Card */}
        <div id="custom-cake-wizard-card" className="rounded-[32px] bg-white p-6 sm:p-8 border border-line/80 shadow-lg scroll-mt-24">
          {/* Progress Header */}
          <div className="mb-6 flex items-center justify-between border-b border-line/60 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange">
                Step {currentStep} of 3
              </span>
              <h2 className="text-xl font-extrabold text-navy">
                {currentStep === 1 && "Contact & Delivery"}
                {currentStep === 2 && "Cake Specifications"}
                {currentStep === 3 && "Reference Photos & Submit"}
              </h2>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    step === currentStep
                      ? "w-8 bg-orange"
                      : step < currentStep
                      ? "w-4 bg-orange/40"
                      : "w-4 bg-cream-deep"
                  }`}
                />
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 animate-in fade-in slide-in-from-top-2">
              {errorMessage}
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleFormKeyDown}>
            {/* STEP 1: Contact & Delivery */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Full Name *
                    <input
                      type="text"
                      name="full_name"
                      required
                      placeholder="e.g. Ayesha Khan"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Phone Number *
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="0300 1234567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Email Address
                    <input
                      type="email"
                      name="email"
                      placeholder="name@example.com (optional)"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    City *
                    <select
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="Karachi">Karachi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Area / Town *
                    <input
                      type="text"
                      name="area"
                      required
                      placeholder="e.g. Clifton Block 5, Gulshan, DHA Phase 6"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Landmark / Nearby Spot
                    <input
                      type="text"
                      name="landmark"
                      placeholder="e.g. Near Ocean Mall, Opposite Park"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>
                </div>

                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  Complete Delivery Address *
                  <textarea
                    name="address"
                    required
                    rows={2}
                    placeholder="House / Apartment #, Street #, Sector..."
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all resize-none"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  Delivery Gate / Access Instructions
                  <input
                    type="text"
                    name="instructions"
                    placeholder="e.g. Ring bell twice, leave with reception"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                  />
                </label>
              </div>
            )}

            {/* STEP 2: Cake Specifications */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Cake Type *
                    <select
                      name="cake_type"
                      required
                      value={formData.cake_type}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="Celebration Cake">Celebration Cake</option>
                      <option value="Fondant 3D Cake">Fondant 3D Sculpted Cake</option>
                      <option value="Wedding Tier Cake">Wedding Multi-Tier Cake</option>
                      <option value="Buttercream Floral">Buttercream Floral Art</option>
                      <option value="Kids Theme Character">Kids Theme Character Cake</option>
                      <option value="Cheesecake Custom">Custom Baked Cheesecake</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Cake Size / Weight *
                    <select
                      name="cake_size"
                      required
                      value={formData.cake_size}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="1 kg / 2.2 lbs (Serves 6-8)">1 kg / 2.2 lbs (Serves 6-8)</option>
                      <option value="2 kg / 4.5 lbs (Serves 12-15)">2 kg / 4.5 lbs (Serves 12-15)</option>
                      <option value="3 kg / 6.6 lbs (Serves 20-25)">3 kg / 6.6 lbs (Serves 20-25)</option>
                      <option value="4 kg / 8.8 lbs (Serves 30-35)">4 kg / 8.8 lbs (Serves 30-35)</option>
                      <option value="5 kg+ / 11 lbs+ (Large Event)">5 kg+ / 11 lbs+ (Large Event)</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Flavour *
                    <select
                      name="flavor"
                      required
                      value={formData.flavor}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="Signature Chocolate Fudge">Signature Chocolate Fudge</option>
                      <option value="Belgian Dark Chocolate">Belgian Dark Chocolate</option>
                      <option value="Red Velvet Cream Cheese">Red Velvet Cream Cheese</option>
                      <option value="Classic Vanilla Bean">Classic Vanilla Bean</option>
                      <option value="Salted Caramel Praline">Salted Caramel Praline</option>
                      <option value="Lotus Biscoff Cream">Lotus Biscoff Cream</option>
                      <option value="Nutella Hazelnut">Nutella Hazelnut Crunch</option>
                      <option value="Ferrero Rocher Royal">Ferrero Rocher Royal</option>
                      <option value="Fresh Strawberry Cream">Fresh Strawberry Cream</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Filling *
                    <select
                      name="filling"
                      required
                      value={formData.filling}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="Rich Chocolate Ganache">Rich Chocolate Ganache</option>
                      <option value="Swiss Meringue Buttercream">Swiss Meringue Buttercream</option>
                      <option value="Cream Cheese Mousse">Cream Cheese Mousse</option>
                      <option value="Salted Caramel Drizzle">Salted Caramel Drizzle</option>
                      <option value="Lotus Speculoos Spread">Lotus Speculoos Spread</option>
                      <option value="Fresh Berry Compote">Fresh Berry Compote</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Shape *
                    <select
                      name="shape"
                      required
                      value={formData.shape}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="Classic Round">Classic Round</option>
                      <option value="Square / Geometric">Square / Geometric</option>
                      <option value="Heart Shape">Romantic Heart Shape</option>
                      <option value="Hexagon">Modern Hexagon</option>
                      <option value="Custom Sculpted 3D">Custom Sculpted 3D</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Number of Tiers *
                    <select
                      name="tiers"
                      required
                      value={formData.tiers}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="Single Tier">Single Tier</option>
                      <option value="2 Tiers">2 Tiers</option>
                      <option value="3 Tiers">3 Tiers</option>
                      <option value="4+ Tiers Grand Wedding">4+ Tiers Grand Wedding</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Preferred Delivery Date *
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Preferred Delivery Time Slot
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="12:00 - 14:00 (Afternoon)">12:00 - 14:00 (Afternoon)</option>
                      <option value="14:00 - 17:00 (Evening)">14:00 - 17:00 (Evening)</option>
                      <option value="17:00 - 20:00 (Night)">17:00 - 20:00 (Night)</option>
                      <option value="Midnight Surprise (23:30 - 00:30)">Midnight Surprise (23:30 - 00:30)</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Theme / Occasion
                    <input
                      type="text"
                      name="theme"
                      placeholder="e.g. 1st Birthday Safari, 25th Silver Jubilee"
                      value={formData.theme}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Dietary Requirements
                    <select
                      name="dietary_requirements"
                      value={formData.dietary_requirements}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    >
                      <option value="Standard (Contains Dairy & Eggs)">Standard (Dairy & Eggs)</option>
                      <option value="100% Eggless">100% Eggless</option>
                      <option value="Gluten-Free / Low Gluten">Gluten-Free Friendly</option>
                      <option value="Nut-Free (Allergy Safe)">Nut-Free (Allergy Safe)</option>
                      <option value="Less Sweet / Diabetic Friendly">Less Sweet / Low Sugar</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Message / Inscription on Cake
                    <input
                      type="text"
                      name="cake_message"
                      placeholder="e.g. Happy Birthday Sarah! (Max 35 chars)"
                      value={formData.cake_message}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Budget / Expected Price (PKR)
                    <input
                      type="number"
                      name="budget"
                      placeholder="e.g. 6500 (optional)"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
                    />
                  </label>
                </div>

                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  Special Design Notes / Handcrafted Details
                  <textarea
                    name="special_instructions"
                    rows={2}
                    placeholder="Specific color scheme, fondant figurines, gold leaf touches, topper style..."
                    value={formData.special_instructions}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all resize-none"
                  />
                </label>
              </div>
            )}

            {/* STEP 3: Reference Photos & Submission */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Upload Zone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-2">
                    Upload Reference Photos (Up to 5 Images)
                  </label>
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        addFiles(Array.from(e.dataTransfer.files));
                      }
                    }}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange/40 bg-orange/5 p-6 text-center cursor-pointer hover:bg-orange/10 hover:border-orange transition-all"
                  >
                    <Upload size={28} className="text-orange animate-bounce-subtle" />
                    <p className="mt-2 text-sm font-extrabold text-navy">
                      Click to browse or drop sample cake photos here
                    </p>
                    <p className="mt-1 text-[11px] text-muted font-medium">
                      Supports JPG, JPEG, PNG, and WebP (High-res compressed automatically to ImageKit CDN)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.jpg,.jpeg,.png,.webp,.jfif,.pjpeg,.heic"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Thumbnail Previews */}
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                    {filePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-line bg-cream shadow-sm"
                      >
                        <img
                          src={preview}
                          alt={`Upload preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          aria-label="Remove image"
                          className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-navy/80 text-white hover:bg-red-600 transition-colors shadow"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Summary Recap */}
                <div className="rounded-2xl bg-cream/60 p-5 border border-line text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-line/60">
                    <span className="font-bold text-navy uppercase tracking-wider text-[11px]">Request Summary</span>
                    <span className="font-extrabold text-orange">{formData.cake_type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted">
                    <div><strong>Customer:</strong> {formData.full_name}</div>
                    <div><strong>Phone:</strong> {formData.phone}</div>
                    <div><strong>Delivery To:</strong> {formData.city}, {formData.area}</div>
                    <div><strong>Target Date:</strong> {formData.date} ({formData.time})</div>
                    <div><strong>Flavour:</strong> {formData.flavor}</div>
                    <div><strong>Filling:</strong> {formData.filling}</div>
                    <div><strong>Shape & Tiers:</strong> {formData.shape} ({formData.tiers})</div>
                    <div><strong>Photos:</strong> {selectedFiles.length} attached</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-line/60 pt-5">
              {currentStep > 1 ? (
                <button
                  key={`prev-btn-step-${currentStep}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prevStep();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-xs font-bold text-navy hover:bg-cream/60 transition-all"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  key={`next-btn-step-${currentStep}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark active:scale-[0.98] transition-all"
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  key="submit-brief-final-btn"
                  type="button"
                  disabled={status === "loading" || !step3Ready}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFinalSubmit();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange px-8 py-3 text-xs font-extrabold text-white shadow-lg shadow-orange/25 hover:bg-orange-dark active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <Clock size={16} className="animate-spin" /> Uploading & Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Submit Custom Brief
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
