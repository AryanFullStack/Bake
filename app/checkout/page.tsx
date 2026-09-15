import type { Metadata } from "next";
import { CheckoutClient } from "@/components/storefront/checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order securely at Bake Bazaar Mart.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
