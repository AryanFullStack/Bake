import { ShieldCheck, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import {
  JsonLd,
  buildBreadcrumbSchema,
  SITE_URL,
} from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Return & Refund Policy - Customer Guarantee",
  description:
    "Review Bake Bazaar Mart's return, exchange, cancellation, and refund policies for bakery items in Karachi and general merchandise shipped nationwide.",
  alternates: {
    canonical: "/refund-cancellation",
  },
  openGraph: {
    title: "Return & Refund Policy | Bake Bazaar Mart",
    description:
      "Bake Bazaar Mart customer return, exchange, cancellation, and refund policies.",
    url: `${SITE_URL}/refund-cancellation`,
    type: "website",
    images: ["/homeDisktop.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Return & Refund Policy | Bake Bazaar Mart",
    description:
      "Review Bake Bazaar Mart return, cancellation, and refund policies.",
    images: ["/homeDisktop.webp"],
  },
};

export default function RefundCancellationPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Return & Refund Policy", url: "/refund-cancellation" },
  ]);

  return (
    <div className="container-shell py-12 md:py-20">
      <JsonLd data={breadcrumbSchema} />
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3">
          <RefreshCw size={14} /> CUSTOMER PROTECTION POLICY
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Refund & Cancellation Policy
        </h1>
        <p className="mt-4 text-base text-muted font-medium leading-relaxed">
          At Bake Bazaar Mart, customer satisfaction and quality are our highest priorities.
          Whether you ordered celebratory bakes in Karachi or general household products nationwide,
          here is how our transparent return and refund policies protect your purchase.
        </p>

        <div className="mt-10 rounded-[32px] bg-white p-8 sm:p-10 border border-line/80 shadow-md space-y-8 text-sm leading-relaxed text-navy/90 font-medium">
          {/* Bakery & Custom Cakes */}
          <div>
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="text-orange" size={20} /> Fresh Bakery & Custom Cake Policy
            </h2>
            <p className="mt-2 text-muted">
              Because cakes, cupcakes, and bakery goods are perishable and prepared fresh to order,
              they cannot be returned after successful delivery. However, if your cake arrives damaged
              in transit, spoiled, or significantly different from your confirmed brief, please photograph
              the issue and email our support team at{" "}
              <a href="mailto:info@bakebazaarmart.com" className="font-bold text-orange hover:underline">
                info@bakebazaarmart.com
              </a>{" "}
              within <strong>4 hours of delivery</strong>. We will promptly issue a full replacement or refund.
            </p>
          </div>

          {/* General Store Products */}
          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <RefreshCw className="text-orange" size={20} /> Home, Kitchen & General Store Products
            </h2>
            <p className="mt-2 text-muted">
              For non-perishable goods (Kitchen Essentials, Home & Decoration, Watches, Baskets & Storage, and Daily Essentials),
              we offer a <strong>3-day inspection window</strong> upon delivery. If an item arrives broken, defective, or incorrect,
              contact us at{" "}
              <a href="mailto:info@bakebazaarmart.com" className="font-bold text-orange hover:underline">
                info@bakebazaarmart.com
              </a>{" "}
              with your order reference number and pictures of the product. Items must be in original condition with unused packaging.
            </p>
          </div>

          {/* Order Cancellation */}
          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <AlertCircle className="text-orange" size={20} /> Cancellation Timeframes
            </h2>
            <div className="mt-2 space-y-2 text-muted">
              <p>
                <strong>Standard Store Orders:</strong> Orders can be cancelled free of charge at any time prior to packing and courier dispatch.
              </p>
              <p>
                <strong>Custom Cakes & Event Bakes:</strong> Custom cake orders must be cancelled at least <strong>24 hours prior</strong> to the scheduled delivery date, as bespoke design, ingredient allocation, and baking commence early on the morning of production.
              </p>
            </div>
          </div>

          {/* Refund Processing */}
          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <Sparkles className="text-orange" size={20} /> Refund Processing & Timelines
            </h2>
            <p className="mt-2 text-muted">
              Approved refunds for bank transfer payments are credited back to your designated bank account within <strong>2 to 3 business days</strong>.
              For Cash on Delivery (COD) orders, approved refunds are transferred via direct online bank transfer or issued as a store credit voucher, based on your preference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
