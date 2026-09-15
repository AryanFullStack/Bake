import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock, Mail, MapPin, Sparkles, Truck, Cake, ArrowRight,
} from "lucide-react";
import { ContactForm } from "@/components/storefront/contact-form";
import { JsonLd, buildBreadcrumbSchema, SITE_URL } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Contact Us - Customer Care & Karachi Delivery Hub",
  description:
    "Get in touch with Bake Bazaar Mart. We are here to assist with fresh bakery orders, custom cake designs, delivery questions in Karachi, and nationwide orders across Pakistan.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Bake Bazaar Mart",
    description:
      "Have questions about an order, custom cake design, or delivery in Karachi & Pakistan? Contact Bake Bazaar Mart customer support.",
    url: `${SITE_URL}/contact`,
    type: "website",
    images: [
      {
        url: "/homeDisktop.webp",
        width: 1200,
        height: 630,
        alt: "Contact Bake Bazaar Mart Customer Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Bake Bazaar Mart",
    description:
      "Get in touch with Bake Bazaar Mart customer support for fresh bakery, custom cakes, and store delivery in Karachi and nationwide across Pakistan.",
    images: ["/homeDisktop.webp"],
  },
};

export default function ContactPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact" },
  ]);

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Bake Bazaar Mart",
    url: `${SITE_URL}/contact`,
    description:
      "Official contact and customer support page for Bake Bazaar Mart in Karachi, Pakistan.",
    mainEntity: {
      "@type": "Organization",
      name: "Bake Bazaar Mart",
      email: "info@bakebazaarmart.com",
      url: SITE_URL,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Karachi",
        addressRegion: "Sindh",
        addressCountry: "PK",
      },
    },
  };

  return (
    <div className="container-shell py-12 md:py-20">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={contactPageSchema} />

      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {/* Left Column: Contact Details & Customer Guidance */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3">
            <Sparkles size={14} /> CUSTOMER CARE & INQUIRIES
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
            Contact Bake Bazaar Mart
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted font-medium max-w-md">
            Have questions about an order, custom cake design, product details, or delivery?
            Our support team is here to help you every step of the way.
          </p>

          <div className="mt-8 flex flex-col gap-4 text-sm font-semibold text-navy">
            {/* Email Support Card */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">Official Email Support</p>
                <a
                  href="mailto:info@bakebazaarmart.com"
                  className="text-base font-extrabold text-navy hover:text-orange transition-colors"
                >
                  info@bakebazaarmart.com
                </a>
                <p className="text-[11px] text-muted font-normal mt-0.5">
                  Direct responses during business hours
                </p>
              </div>
            </div>

            {/* Location & Hub Card */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">Business Location & Delivery Hub</p>
                <p className="text-sm font-bold text-navy">
                  Karachi, Pakistan
                </p>
                <p className="text-[11px] text-muted font-normal mt-0.5">
                  Local dispatch in Karachi · Online delivery across Pakistan
                </p>
              </div>
            </div>

            {/* Support Hours Card */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green/10 text-green">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">Customer Support Hours</p>
                <p className="text-sm font-bold text-navy">
                  Monday – Sunday: 9:00 AM – 10:00 PM
                </p>
                <p className="text-[11px] text-muted font-normal mt-0.5">
                  Website open 24/7 for online ordering
                </p>
              </div>
            </div>
          </div>

          {/* Quick Self-Service Links */}
          <div className="mt-8 rounded-2xl bg-cream-deep/70 p-5 border border-line/60 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-navy">Looking for quick updates?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/track-order"
                className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-navy hover:text-orange transition-colors border border-line/70 shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Truck size={14} className="text-orange" /> Track Regular Order
                </span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/track-custom-cake"
                className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-navy hover:text-orange transition-colors border border-line/70 shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Cake size={14} className="text-orange" /> Track Custom Cake
                </span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <ContactForm />
      </div>
    </div>
  );
}
