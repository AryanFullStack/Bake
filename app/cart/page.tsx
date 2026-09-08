"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { useCart } from "@/components/storefront/cart-provider";

export default function CartPage() {
  const { items, total, update, remove } = useCart();
  const freeThreshold = 3000;
  const delivery = total >= freeThreshold || total === 0 ? 0 : 250;
  const amountNeededForFreeDelivery = Math.max(0, freeThreshold - total);

  return (
    <div className="container-shell py-10 md:py-16">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange">
          Your Shopping Basket
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Good Choices.
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="mt-12 rounded-[32px] bg-white p-12 text-center border border-line/80 shadow-xs max-w-2xl mx-auto">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-orange/10 text-orange">
            <ShoppingBag size={36} />
          </div>
          <h2 className="mt-6 font-display text-3xl font-bold text-navy">
            Your basket is waiting for something sweet.
          </h2>
          <p className="mt-3 text-sm text-muted max-w-md mx-auto">
            Browse our fresh bakery counter for celebration cakes, flaky morning pastries, cupcakes and brownies.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-orange px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/20 hover:bg-orange-dark transition-all"
          >
            <span>Explore Bakery Counter</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left Column: Item List */}
          <div className="flex flex-col gap-4">
            {/* Free Shipping Progress Indicator */}
            <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-navy">
                <Truck size={16} className="text-orange" />
                {amountNeededForFreeDelivery > 0 ? (
                  <span>
                    Add <strong className="text-orange">{formatPKR(amountNeededForFreeDelivery)}</strong> more for <strong className="text-green">FREE Delivery!</strong>
                  </span>
                ) : (
                  <span className="text-green font-extrabold">
                    🎉 You've unlocked FREE Delivery across Pakistan!
                  </span>
                )}
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-cream-deep">
                <div
                  className="h-full bg-orange transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (total / freeThreshold) * 100)}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={`${item.id}:${item.variationId ?? "base"}`}
                  className="flex gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs items-center"
                >
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-cream-deep border border-line">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-orange tracking-wider">
                          {item.category}
                        </p>
                        <h2 className="font-bold text-navy text-base leading-snug">
                          <Link href={`/products/${item.slug}`} className="hover:text-orange transition-colors">
                            {item.name}
                          </Link>
                        </h2>
                        {item.variationTitle && item.variationTitle !== item.name && (
                          <p className="mt-0.5 text-xs font-bold text-orange">
                            Option: {item.variationTitle}
                          </p>
                        )}
                        {item.variationAttributes && (
                          <p className="mt-0.5 text-xs font-semibold text-muted">
                            {Object.entries(item.variationAttributes).map(([key, value]) => `${key}: ${value}`).join(" · ")}
                          </p>
                        )}
                        {item.sku && (
                          <p className="mt-0.5 text-[11px] text-muted font-mono">
                            SKU: {item.sku}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(item.id, item.variationId)}
                        className="text-muted hover:text-red-500 p-1 transition-colors"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {/* Quantity Modifier */}
                      <div className="flex items-center rounded-xl border border-line bg-cream/50">
                        <button
                          onClick={() => update(item.id, item.quantity - 1, item.variationId)}
                          className="p-2 text-navy hover:text-orange"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-navy">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => update(item.id, item.quantity + 1, item.variationId)}
                          className="p-2 text-navy hover:text-orange"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-navy text-base">
                          {formatPKR((item.salePrice ?? item.price) * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-muted font-medium">
                            {formatPKR(item.salePrice ?? item.price)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <aside className="h-fit rounded-[28px] bg-white p-6 border border-line/80 shadow-md">
            <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4">
              Order Summary
            </h2>

            <div className="mt-5 flex flex-col gap-3 text-sm font-medium text-navy/80">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span className="font-bold text-navy">{formatPKR(total)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted">Estimated Delivery</span>
                <span className="font-bold">
                  {delivery === 0 ? (
                    <span className="text-green font-extrabold">FREE</span>
                  ) : (
                    formatPKR(delivery)
                  )}
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-line pt-4 flex justify-between items-baseline font-bold text-navy">
              <span className="font-display text-xl">Total</span>
              <span className="font-display text-3xl font-extrabold text-orange">
                {formatPKR(total + delivery)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/20 hover:bg-orange-dark transition-all hover:scale-[1.01] active:scale-95"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-4 text-center text-xs text-muted font-medium flex flex-col gap-1">
              <p>✓ Guest Checkout Available — No login required</p>
              <p>✓ Cash on Delivery & Bank Transfer Accepted</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
