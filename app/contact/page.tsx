"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, MessageSquare, Phone, Send, ShieldCheck, Sparkles } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="container-shell py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {/* Left Column: Contact Details */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3">
            <Sparkles size={14} /> WE'RE ALWAYS HERE FOR YOU
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
            Come Say Hello.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted font-medium max-w-md">
            Have a question about an upcoming order, delivery time, or custom cake consultation? Get in touch with our team.
          </p>

          <div className="mt-8 flex flex-col gap-4 text-sm font-semibold text-navy">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">Order Hotline & WhatsApp</p>
                <a href="tel:03211234567" className="text-base font-extrabold text-navy hover:text-orange transition-colors">
                  0321-1234567
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">Email Support</p>
                <a href="mailto:hello@bakemartbazaar.pk" className="text-base font-extrabold text-navy hover:text-orange transition-colors">
                  hello@bakemartbazaar.pk
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">Main Kitchen Address</p>
                <p className="text-sm font-bold text-navy">
                  Gulberg III, Main Boulevard, Lahore, Pakistan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green/10 text-green">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">Kitchen Operating Hours</p>
                <p className="text-sm font-bold text-navy">
                  Monday – Sunday: 9:00 AM – 10:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Contact Form */}
        <div className="rounded-[32px] bg-white p-8 sm:p-10 border border-line/80 shadow-md">
          <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-orange" /> Send Us A Message
          </h2>

          {submitted ? (
            <div className="mt-6 rounded-2xl bg-green/10 p-6 text-center border border-green/20 text-xs font-bold text-green animate-fade-in">
              <Sparkles size={24} className="mx-auto mb-2" />
              <p className="text-base font-display">Thank you for reaching out!</p>
              <p className="mt-1 font-medium text-navy/80">We’ve received your message and will respond within 2 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                Your Full Name <span className="text-orange">*</span>
                <input
                  required
                  placeholder="e.g. Ayesha Khan"
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                Phone Number <span className="text-orange">*</span>
                <input
                  type="tel"
                  required
                  placeholder="03XX XXXXXXX"
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                Email Address
                <input
                  type="email"
                  placeholder="ayesha@example.com"
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                How Can We Help You? <span className="text-orange">*</span>
                <textarea
                  rows={4}
                  required
                  placeholder="Ask about orders, delivery slots, flavor ingredients..."
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                />
              </label>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/20 hover:bg-orange-dark transition-all"
              >
                <span>Send Message</span>
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
