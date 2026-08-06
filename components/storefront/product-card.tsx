"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Heart, Plus, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPKR } from "@/lib/catalog";
import { useCart } from "./cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const discount = product.salePrice && product.price > product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : null;

  async function toggleWishlist(event: React.MouseEvent) {
    event.preventDefault(); event.stopPropagation();
    try { const response = await fetch("/api/wishlist", { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: product.id }) }); if (response.ok) setSaved(!saved); } catch { setSaved(!saved); }
  }
  function addToCart(event: React.MouseEvent) { event.preventDefault(); event.stopPropagation(); if (product.stock < 1) return; add(product); setAdded(true); setTimeout(() => setAdded(false), 1200); }

  return <article className="group flex min-w-0 flex-col overflow-hidden border border-line/80 bg-white shadow-[0_8px_26px_rgba(6,33,54,.045)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(6,33,54,.10)]" style={{ borderRadius: "var(--radius-card)" }}>
    <div className="relative aspect-[.92] overflow-hidden bg-cream-deep"><Link href={`/products/${product.slug}`} className="block h-full"><Image src={product.image} alt={product.name} width={800} height={860} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]" /></Link><div className="absolute left-3 top-3 flex flex-col gap-1.5">{discount && <span className="rounded-md bg-orange px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">{discount}% off</span>}{product.bestseller && !discount && <span className="rounded-md bg-navy px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">Bestseller</span>}</div><button onClick={toggleWishlist} className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-navy shadow-sm transition-colors hover:text-orange ${saved ? "text-orange" : ""}`} aria-label={`Save ${product.name} to wishlist`}><Heart size={16} fill={saved ? "currentColor" : "none"} /></button><button onClick={addToCart} disabled={product.stock < 1} className={`absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full text-white shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${added ? "bg-green" : "bg-orange hover:bg-orange-dark"}`} aria-label={`Add ${product.name} to basket`}>{added ? <Check size={17} /> : <Plus size={18} />}</button></div>
    <div className="flex flex-1 flex-col p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><span className="truncate text-[10px] font-extrabold uppercase tracking-[.14em] text-orange">{product.category}</span><span className="flex items-center gap-1 text-xs font-bold text-navy"><Star size={12} fill="currentColor" className="text-orange" />{product.rating ? product.rating.toFixed(1) : "New"}</span></div><Link href={`/products/${product.slug}`} className="mt-2 block"><h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-navy transition-colors group-hover:text-orange">{product.name}</h3></Link><p className="mt-2 text-[11px] font-semibold text-muted">{product.stock > 0 ? <span className="text-green">Fresh & available</span> : <span className="text-red-500">Sold out today</span>}</p><div className="mt-4 flex items-end justify-between gap-2 border-t border-line/70 pt-3"><div><span className="block text-base font-extrabold text-navy">{formatPKR(product.salePrice ?? product.price)}</span>{product.salePrice && <span className="text-[11px] font-medium text-muted line-through">{formatPKR(product.price)}</span>}</div><Link href={`/products/${product.slug}`} className="text-[11px] font-extrabold text-navy hover:text-orange">View bake →</Link></div></div>
  </article>;
}
