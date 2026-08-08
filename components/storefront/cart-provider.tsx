"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";

type CartContextValue = { items: CartItem[]; count: number; total: number; add: (product: Product) => void; update: (id: string, quantity: number, variationId?: string) => void; remove: (id: string, variationId?: string) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { const stored = window.localStorage.getItem("bmb-cart"); if (stored) setItems(JSON.parse(stored)); }, []);
  useEffect(() => { window.localStorage.setItem("bmb-cart", JSON.stringify(items)); }, [items]);
  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.quantity, 0),
    add: (product: Product) => setItems((current) => {
      const variationId = (product as CartItem).variationId;
      const existing = current.find((item) => item.id === product.id && item.variationId === variationId);
      return existing
        ? current.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    }),
    update: (id: string, quantity: number, variationId?: string) => setItems((current) => quantity < 1 ? current.filter((item) => !(item.id === id && item.variationId === variationId)) : current.map((item) => item.id === id && item.variationId === variationId ? { ...item, quantity } : item)),
    remove: (id: string, variationId?: string) => setItems((current) => current.filter((item) => !(item.id === id && item.variationId === variationId))),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
