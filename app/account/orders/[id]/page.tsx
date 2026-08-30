import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, MapPin, Package, ShieldCheck, Star, Truck } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/account/orders/${id}`);
  }

  const supabase = await createSupabaseServerClient();

  // Query order by UUID id or order_number matching user_id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_id,
        variation_id,
        variation_attributes,
        variation_title,
        image_path,
        product_name,
        sku,
        unit_price,
        quantity,
        line_total,
        products!left (slug)
      ),
      payments (
        method,
        status,
        created_at
      ),
      order_status_history (
        new_status,
        note,
        created_at
      )
    `)
    .eq("user_id", user.id);

  const { data: order, error } = isUuid
    ? await query.eq("id", id).maybeSingle()
    : await query.eq("order_number", id).maybeSingle();

  if (error || !order) {
    notFound();
  }

  const items = order.order_items ?? [];
  const statusFormatted = String(order.status || "placed").replaceAll("_", " ");
  const paymentRecord = order.payments?.[0];

  return (
    <div className="container-shell py-10 md:py-16">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange hover:underline mb-6"
      >
        <ArrowLeft size={14} /> Back to Order History
      </Link>

      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[32px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-green bg-green/10 px-3 py-1 rounded-full border border-green/20">
              {statusFormatted}
            </span>
            <span className="text-xs text-muted font-medium">
              Placed on {new Date(order.created_at).toLocaleDateString("en-PK", { dateStyle: "medium" })}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy">
            Order {order.order_number}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/track-order?order=${order.order_number}&phone=${encodeURIComponent(order.customer_phone || "")}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange px-5 py-3 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark transition-all"
          >
            <Truck size={15} /> Track Order Progress
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Purchased Order Items */}
        <section className="flex flex-col gap-6">
          <div className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
            <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 mb-6 flex items-center gap-2">
              <Package size={20} className="text-orange" /> Purchased Items ({items.length} {items.length === 1 ? "item" : "items"})
            </h2>

            <div className="flex flex-col gap-5">
              {items.map((item: any) => {
                const productSlug = item.products?.slug;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-cream/30 p-4 border border-line/70"
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-deep border border-line">
                        <Image
                          src={item.image_path || "/placeholder-bake.svg"}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-navy text-base leading-snug truncate">
                          {productSlug ? (
                            <Link href={`/products/${productSlug}`} className="hover:text-orange transition-colors">
                              {item.product_name}
                            </Link>
                          ) : (
                            item.product_name
                          )}
                        </h3>
                        {item.variation_title && item.variation_title !== item.product_name && (
                          <p className="mt-0.5 text-xs font-bold text-orange">
                            Option: {item.variation_title}
                          </p>
                        )}
                        {item.variation_attributes && (
                          <p className="mt-0.5 text-xs font-semibold text-muted">
                            {Object.entries(item.variation_attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                        {item.sku && (
                          <p className="mt-1 text-[11px] font-mono text-muted">
                            SKU: {item.sku}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-line/60">
                      <p className="font-extrabold text-navy text-base">
                        {formatPKR(item.line_total)}
                      </p>
                      <p className="text-xs text-muted font-medium">
                        {item.quantity} × {formatPKR(item.unit_price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address Snapshot */}
          <div className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
            <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4 mb-5 flex items-center gap-2">
              <MapPin size={20} className="text-orange" /> Delivery Information Snapshot
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs font-medium text-navy">
              <div>
                <span className="block font-semibold text-muted text-[11px] uppercase tracking-wider">Recipient Name</span>
                <span className="font-bold text-sm text-navy">{order.customer_name}</span>
              </div>
              <div>
                <span className="block font-semibold text-muted text-[11px] uppercase tracking-wider">Contact Phone</span>
                <span className="font-bold text-sm text-navy">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div>
                  <span className="block font-semibold text-muted text-[11px] uppercase tracking-wider">Email Address</span>
                  <span className="font-bold text-navy">{order.customer_email}</span>
                </div>
              )}
              <div>
                <span className="block font-semibold text-muted text-[11px] uppercase tracking-wider">City / Area</span>
                <span className="font-bold text-navy">{order.city}, {order.area}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-line/60">
              <span className="block font-semibold text-muted text-[11px] uppercase tracking-wider mb-1">Full Delivery Address</span>
              <p className="text-sm font-medium text-navy leading-relaxed bg-cream/40 p-3 rounded-xl border border-line/60">
                {order.delivery_address}
                {order.landmark ? ` (Landmark: ${order.landmark})` : ""}
              </p>
            </div>
            {order.delivery_instructions && (
              <div className="mt-3">
                <span className="block font-semibold text-muted text-[11px] uppercase tracking-wider mb-1">Delivery Instructions</span>
                <p className="text-xs text-muted italic bg-orange/5 p-3 rounded-xl border border-orange/20">
                  "{order.delivery_instructions}"
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Financial Breakdown */}
        <aside className="h-fit rounded-[28px] bg-white p-6 border border-line/80 shadow-md flex flex-col gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4">
              Payment Summary
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-xs font-medium text-navy/80">
              <div className="flex justify-between">
                <span className="text-muted">Items Subtotal</span>
                <span className="font-bold text-navy">{formatPKR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Delivery Fee</span>
                <span className="font-bold">
                  {order.delivery_fee === 0 ? (
                    <span className="text-green font-extrabold">FREE</span>
                  ) : (
                    formatPKR(order.delivery_fee)
                  )}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green font-bold">
                  <span>Discount</span>
                  <span>-{formatPKR(order.discount)}</span>
                </div>
              )}
            </div>

            <div className="my-5 border-t border-line pt-4 flex justify-between items-baseline">
              <span className="font-display text-xl font-bold text-navy">Grand Total</span>
              <span className="font-display text-3xl font-extrabold text-orange">
                {formatPKR(order.total)}
              </span>
            </div>

            <div className="rounded-2xl bg-cream/50 p-4 border border-line/70 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted font-medium">Payment Method:</span>
                <span className="font-bold uppercase text-navy">
                  {String(order.payment_method || "cod").replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted font-medium">Payment Status:</span>
                <span className="font-bold capitalize text-green">
                  {String(paymentRecord?.status || "Pending").replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <Link
              href={`/track-order?order=${order.order_number}&phone=${encodeURIComponent(order.customer_phone || "")}`}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark transition-all"
            >
              <span>Track Live Bakery Progress</span>
              <Truck size={15} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
