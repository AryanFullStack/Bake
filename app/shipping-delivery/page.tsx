import { Clock, MapPin, ShieldCheck, Sparkles, Truck } from "lucide-react";

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
          We treat delivery as the final step of our artisan baking process. Here is how we ensure your cakes and pastries arrive fresh and beautiful.
        </p>

        <div className="mt-10 rounded-[32px] bg-white p-8 sm:p-10 border border-line/80 shadow-md space-y-8 text-sm leading-relaxed text-navy/90 font-medium">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <MapPin className="text-orange" size={20} /> Service Coverage & Delivery Cities
            </h2>
            <p className="mt-2 text-muted">
              We currently accept online orders for <strong>Lahore, Islamabad, Rawalpindi, and Karachi</strong>. Same-day delivery is available for orders placed before <strong>1:00 PM</strong> in Lahore.
            </p>
          </div>

          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <Truck className="text-orange" size={20} /> Delivery Charges & Free Threshold
            </h2>
            <p className="mt-2 text-muted">
              Standard local delivery fee is <strong>PKR 250</strong>. Orders totaling <strong>PKR 3,000 or above</strong> automatically qualify for <strong>FREE Delivery</strong> across our service cities!
            </p>
          </div>

          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="text-orange" size={20} /> Chilled Packaging & Temperature Control
            </h2>
            <p className="mt-2 text-muted">
              Celebration cakes are packed in double-walled insulated cake boxes with ice gel packs during warm weather to preserve cream structure and fondant finishes during transit.
            </p>
          </div>

          <div className="border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold text-navy flex items-center gap-2">
              <Clock className="text-orange" size={20} /> Preferred Delivery Slots
            </h2>
            <p className="mt-2 text-muted">
              You can select your preferred delivery time slot during checkout. Our delivery rider will contact you via phone prior to dispatching your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
