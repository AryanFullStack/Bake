import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerOrdersList } from "@/components/account/customer-orders-list";

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
    .limit(1000);

  return (
    <div className="container-shell py-12 md:py-16">
      <Link href="/account" className="text-sm font-bold text-orange hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 text-5xl font-bold text-navy">Your orders</h1>

      <div className="mt-8">
        <CustomerOrdersList initialOrders={orders || []} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
