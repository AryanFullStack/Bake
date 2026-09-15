"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquare, Send } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }, 600);
  }

  return (
    <div className="rounded-[32px] bg-white p-8 sm:p-10 border border-line/80 shadow-md">
      <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
        <MessageSquare size={20} className="text-orange" /> Send Us A Message
      </h2>

      {submitted ? (
        <div className="mt-6 rounded-2xl bg-green/10 p-6 text-center border border-green/20 text-xs font-bold text-green animate-fade-in">
          <CheckCircle2 size={28} className="mx-auto mb-2 text-green" />
          <p className="text-base font-display text-navy">Thank you for reaching out!</p>
          <p className="mt-1 font-medium text-muted leading-relaxed">
            We’ve received your message and our team will get back to you via email shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-navy">
            Your Full Name <span className="text-orange">*</span>
            <input
              required
              placeholder="e.g. Ayesha Khan"
              className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider text-navy">
            Email Address <span className="text-orange">*</span>
            <input
              type="email"
              required
              placeholder="ayesha@example.com"
              className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider text-navy">
            Phone Number (Optional)
            <input
              type="tel"
              placeholder="03XX XXXXXXX"
              className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider text-navy">
            Inquiry Topic <span className="text-orange">*</span>
            <select
              required
              className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white transition-colors"
            >
              <option value="order">Order Status & Delivery Question</option>
              <option value="custom_cake">Custom Cake Consultation</option>
              <option value="products">Product & Catalog Inquiry</option>
              <option value="returns">Return, Exchange or Refund</option>
              <option value="general">General Support</option>
            </select>
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider text-navy">
            How Can We Help You? <span className="text-orange">*</span>
            <textarea
              rows={4}
              required
              placeholder="Provide details about your question, order number, custom cake requirements, or feedback..."
              className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/20 hover:bg-orange-dark transition-all disabled:opacity-60"
          >
            <span>{loading ? "Sending Message..." : "Send Message"}</span>
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}

