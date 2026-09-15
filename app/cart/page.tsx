import type { Metadata } from "next";
import { CartClient } from "@/components/storefront/cart-client";

export const metadata: Metadata = {
  title: "Shopping Basket | Bake Bazaar Mart",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return <CartClient />;
}
