import Link from "next/link";
import { ArrowRight, Package, Star } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="container-shell py-16 text-center">
        <h1 className="text-4xl font-bold text-navy">Sign in to see your orders</h1>
        <Link href="/login?next=/account/orders" className="mt-5 inline-block rounded-xl bg-orange px-5 py-3 text-sm font-bold text-white">
          Log in
        </Link>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total, status, created_at, order_items(product_id, product_name, quantity, products!left(slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="container-shell py-12 md:py-16">
      <Link href="/account" className="text-sm font-bold text-orange hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 text-5xl font-bold text-navy">Your orders</h1>

      <div className="mt-8 grid gap-5">
        {orders?.length ? (
          orders.map((order: any) => {
            const isDelivered = order.status === "delivered";
            const itemCount = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0;

            return (
              <div key={order.order_number} className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-green/10 text-green">
                      <Package size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-green bg-green/10 px-2.5 py-1 rounded-full border border-green/20">
                        {order.status.replaceAll("_", " ")}
                      </span>
                      <h2 className="mt-1.5 font-display text-2xl font-bold text-navy">{order.order_number}</h2>
                      <p className="mt-1 text-xs text-muted font-medium">
                        {itemCount} {itemCount === 1 ? "item" : "items"} · {new Date(order.created_at).toLocaleDateString("en-PK")}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-display text-xl font-bold text-navy">{formatPKR(order.total)}</p>
                    <div className="mt-2 flex items-center gap-3 justify-start sm:justify-end">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:underline"
                      >
                        View Order Details →
                      </Link>
                      <span className="text-line">•</span>
                      <Link
                        href={`/track-order?order=${order.order_number}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-orange"
                      >
                        Track <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Delivered Orders Product Review Triggers */}
                {isDelivered && order.order_items?.length > 0 && (
                  <div className="mt-6 border-t border-line/60 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange flex items-center gap-1.5 mb-3">
                      <Star size={13} className="fill-orange text-orange" /> Review Items From This Order
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {order.order_items.map((item: any) => {
                        const productSlug = (item.products as any)?.slug;
                        if (!productSlug) return null;
                        return (
                          <Link
                            key={item.product_id}
                            href={`/products/${productSlug}?review_order=${order.order_number}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-cream-deep/70 px-3.5 py-2 text-xs font-bold text-navy hover:bg-orange hover:text-white transition-all shadow-2xs"
                          >
                            <Star size={12} className="fill-current" />
                            <span>Review {item.product_name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-[28px] bg-white p-12 text-center border border-line/80 shadow-xs">
            <Package size={32} className="mx-auto text-cream-deep mb-3" />
            <p className="text-sm font-bold text-muted">
              You have not placed an order yet.{" "}
              <Link href="/shop" className="text-orange underline">
                Browse the bakery catalog
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
