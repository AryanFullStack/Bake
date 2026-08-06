"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Search, Sparkles } from "lucide-react";

export function FaqList({ faqs }: { faqs: any[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [query, setQuery] = useState("");

  const filteredFaqs = faqs.filter(
    (f) =>
      !query ||
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto mt-10 max-w-3xl flex flex-col gap-6">
      {/* Search Input Filter */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions (e.g. fresh, delivery, custom cake, payment)..."
          className="w-full rounded-2xl border border-line bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-navy outline-none shadow-xs transition focus:border-orange"
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="rounded-[32px] bg-white p-4 sm:p-6 border border-line/80 shadow-md">
        {filteredFaqs.length ? (
          filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id}
                className="border-b border-line/70 last:border-0 py-2 transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left font-bold text-navy hover:text-orange transition-colors"
                >
                  <span className="text-base sm:text-lg font-display flex items-center gap-2.5">
                    <HelpCircle size={18} className="text-orange shrink-0" />
                    {faq.question}
                  </span>
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-orange text-white" : "bg-cream-deep text-navy"
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 pt-1 text-sm leading-relaxed text-muted font-medium animate-fade-in pl-11">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-sm text-muted">
            No FAQs matching “{query}”. Please contact customer care for assistance.
          </div>
        )}
      </div>
    </div>
  );
}
