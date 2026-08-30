"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product | CartItem, quantity?: number) => void;
  update: (id: string, quantity: number, variationId?: string) => void;
  remove: (id: string, variationId?: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("bmb-cart");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load cart from localStorage", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      window.localStorage.setItem("bmb-cart", JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.quantity, 0),
      add: (product: Product | CartItem, quantityToAdd: number = 1) =>
        setItems((current) => {
          const variationId = (product as CartItem).variationId;
          const qty = Math.max(1, quantityToAdd);
          const existingIndex = current.findIndex(
            (item) => item.id === product.id && (item.variationId || null) === (variationId || null)
          );

          if (existingIndex > -1) {
            const updated = [...current];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + qty,
            };
            return updated;
          }

          return [...current, { ...product, quantity: qty }];
        }),
      update: (id: string, quantity: number, variationId?: string) =>
        setItems((current) =>
          quantity < 1
            ? current.filter((item) => !(item.id === id && (item.variationId || null) === (variationId || null)))
            : current.map((item) =>
                item.id === id && (item.variationId || null) === (variationId || null)
                  ? { ...item, quantity }
                  : item
              )
        ),
      remove: (id: string, variationId?: string) =>
        setItems((current) =>
          current.filter((item) => !(item.id === id && (item.variationId || null) === (variationId || null)))
        ),
      clear: () => setItems([]),
    }),
    [items, isHydrated]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

