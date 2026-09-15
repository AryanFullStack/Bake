import type { Metadata } from "next";
import { getFaqs } from "@/lib/storefront";
import { FaqList } from "@/components/storefront/faq-list";
import { Sparkles } from "lucide-react";
import {
  JsonLd,
  buildFaqSchema,
  buildBreadcrumbSchema,
  SITE_URL,
} from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - Orders, Delivery & Custom Cakes",
  description:
    "Find answers to frequently asked questions about Bake Bazaar Mart, Karachi local delivery, nationwide shipping across Pakistan, custom cakes, and payments.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | Bake Bazaar Mart",
    description:
      "Frequently asked questions about Bake Bazaar Mart orders, same-day Karachi delivery, Pakistan nationwide shipping, custom cakes, and payment options.",
    url: `${SITE_URL}/faq`,
    type: "website",
    images: ["/homeDisktop.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | Bake Bazaar Mart",
    description:
      "Find answers to common questions about Bake Bazaar Mart products, ordering, and delivery.",
    images: ["/homeDisktop.webp"],
  },
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "FAQs", url: "/faq" },
  ]);

  const faqSchema = buildFaqSchema(
    faqs.map((f) => ({
      question: f.question,
      answer: f.answer,
    }))
  );

  return (
    <div className="container-shell py-12 md:py-20">
      <JsonLd data={breadcrumbSchema} />
      {faqs.length > 0 && <JsonLd data={faqSchema} />}

      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3">
          <Sparkles size={14} /> GOT QUESTIONS?
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
          Everything you need to know about our products, Karachi local delivery, nationwide courier delivery across Pakistan, custom cakes, and payment options.
        </p>
      </div>

      <FaqList faqs={faqs} />
    </div>
  );
}

export const revalidate = 3600;
