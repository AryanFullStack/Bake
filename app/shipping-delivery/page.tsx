import { Clock, MapPin, ShieldCheck, Sparkles, Truck, Package, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Information",
  description:
    "Bake Bazaar Mart shipping and delivery guidelines — fast local delivery in Karachi and nationwide online delivery all across Pakistan.",
};

export default function ShippingDeliveryPage() {
  return (
    <div className="container-shell py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3">
          <Truck size={14} /> DELIVERY & LOGISTICS POLICY
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Shipping & Delivery Guidelines
        </h1>
        <p className="mt-4 text-base text-muted font-medium leading-relaxed">
          Bake Bazaar Mart is based in Karachi, Pakistan. Whether you are ordering a delicate celebration cake for a family event or everyday kitchen and home essentials, here is how we ensure your package arrives safely and promptly.
        </p>

        <div className="mt-10 rounded-[32px] bg-white p-8 sm:p-10 border border-line/80 shadow-md space-y-8 text-sm leading-relaxed text-navy/90 font-medium">
          {/* Section 1: Coverage */}
          <div>
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <MapPin className="text-orange" size={20} /> Service Coverage: Karachi & Nationwide Pakistan
            </h2>
            <div className="mt-3 space-y-3 text-muted">
              <p>
                <strong className="text-navy">Karachi Local Delivery:</strong> We offer fast local doorstep delivery across all areas of Karachi (including Clifton, DHA, Gulshan-e-Iqbal, PECHS, Nazimabad, Gulistan-e-Johar, North Karachi, and surrounding sectors). Same-day delivery is available for orders placed before <strong>1:00 PM</strong>.
              </p>
              <p>
                <strong className="text-navy">Online Delivery Across Pakistan:</strong> All non-perishable general store goods — including Kitchen Essentials, Home & Decoration, Watches & Accessories, Baskets & Storage, and Daily Essentials — are shipped nationwide to all cities and towns across Pakistan via trusted courier partners (TCS, Leopards, Trax, M&P).
              </p>
            </div>
          </div>

          {/* Section 2: Delivery Charges */}
          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <Truck className="text-orange" size={20} /> Delivery Charges & Free Threshold
            </h2>
            <p className="mt-2 text-muted">
              Standard delivery fee is <strong>PKR 250</strong> per order. Orders totaling <strong>PKR 3,000 or above</strong> automatically qualify for <strong>FREE Delivery</strong> anywhere in Pakistan!
            </p>
          </div>

          {/* Section 3: Safe Packaging */}
          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="text-orange" size={20} /> Temperature-Controlled & Protective Packaging
            </h2>
            <div className="mt-2 space-y-2 text-muted">
              <p>
                <strong className="text-navy">Bakery & Custom Cakes:</strong> Handcrafted cakes are packed in reinforced, insulated cake boxes. During warmer weather, temperature-maintaining ice gel packs are used to preserve cream structure and fine decorating finishes during transit in Karachi.
              </p>
              <p>
                <strong className="text-navy">Home & Kitchen Goods:</strong> Glassware, home accents, and kitchen utensils are wrapped in shock-absorbent cushioning and sturdy cartons to prevent breakage during transport.
              </p>
            </div>
          </div>

          {/* Section 4: Delivery Slots & Timelines */}
          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <Clock className="text-orange" size={20} /> Delivery Timeframes & Preferred Slots
            </h2>
            <div className="mt-2 space-y-2 text-muted">
              <p>
                <strong>Karachi Express & Scheduled Bakes:</strong> You can select your preferred delivery date and time slot during checkout. Our delivery rider contacts you via phone prior to dispatching your order.
              </p>
              <p>
                <strong>Nationwide Courier:</strong> Deliveries to major cities (Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, etc.) typically arrive within 2 to 4 business days. Regional and remote destinations may take 3 to 6 business days.
              </p>
            </div>
          </div>

          {/* Section 5: Tracking */}
          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <Package className="text-orange" size={20} /> Real-Time Order Tracking
            </h2>
            <p className="mt-2 text-muted">
              Every order generates a unique reference number (e.g. <code>BM-10024</code>) sent to your contact details. You can track your parcel's live status anytime on our{" "}
              <Link href="/track-order" className="text-orange font-bold hover:underline">
                Order Tracking
              </Link>{" "}
              page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
