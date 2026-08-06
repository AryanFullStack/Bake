import { getFaqs } from "@/lib/storefront";
import { FaqList } from "@/components/storefront/faq-list";
import { Sparkles } from "lucide-react";

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <div className="container-shell py-12 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3">
          <Sparkles size={14} /> GOT QUESTIONS?
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
          Everything you need to know about our fresh small-batch baking, delivery schedules, custom cake orders, and payment options.
        </p>
      </div>

      <FaqList faqs={faqs} />
    </div>
  );
}

export const dynamic = "force-dynamic";
