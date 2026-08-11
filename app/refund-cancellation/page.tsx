import { ShieldCheck, Sparkles, RefreshCw } from "lucide-react";

export default function RefundCancellationPage() {
  return (
    <div className="container-shell py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3">
          <RefreshCw size={14} /> CUSTOMER PROTECTION POLICY
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Refund & Cancellation Policy
        </h1>
        <p className="mt-4 text-base text-muted font-medium leading-relaxed">
          At Bake Mart Bazaar, customer satisfaction and quality are our top priorities. If anything goes wrong with your order, we are here to make it right.
        </p>

        <div className="mt-10 rounded-[32px] bg-white p-8 sm:p-10 border border-line/80 shadow-md space-y-8 text-sm leading-relaxed text-navy/90 font-medium">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="text-orange" size={20} /> Freshness & Quality Guarantee
            </h2>
            <p className="mt-2 text-muted">
              If your cake or bakery item arrives damaged or does not meet our quality standards, please take a photo and contact our team within <strong>4 hours of delivery</strong> at <strong>0321-1234567</strong>. We will issue a full replacement or refund.
            </p>
          </div>

          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <RefreshCw className="text-orange" size={20} /> Order Cancellation Timeframe
            </h2>
            <p className="mt-2 text-muted">
              Standard counter orders can be canceled up to <strong>2 hours before your scheduled delivery slot</strong>. Custom cake orders must be canceled at least <strong>24 hours prior</strong> to the scheduled date, as custom cake baking begins early in the morning.
            </p>
          </div>

          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <Sparkles className="text-orange" size={20} /> Refund Processing
            </h2>
            <p className="mt-2 text-muted">
              Approved refunds for bank transfer payments will be credited back to your original bank account within 2-3 business days. Cash on delivery orders will be issued as a bakery store credit code or direct online transfer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
