"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Package, Star } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { PaginationControls } from "@/components/pagination";

export function CustomerOrdersList({ initialOrders }: { initialOrders: any[] }) {
  const [orders] = useState<any[]>(initialOrders);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedOrders = useMemo(() => {
    const from = (page - 1) * pageSize;
    return orders.slice(from, from + pageSize);
  }, [orders, page, pageSize]);

  if (!orders || orders.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-5">
      {paginatedOrders.map((order: any) => {
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
      })}

      <PaginationControls
        currentPage={page}
        pageSize={pageSize}
        totalItems={orders.length}
        itemLabel="orders"
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
        className="mt-4"
      />
    </div>
  );
}
