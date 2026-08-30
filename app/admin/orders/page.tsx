import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AdminOrdersManager } from "@/components/admin/orders-manager";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();
  const dbClient = adminClient ?? supabase;

  const { data } = await dbClient
    .from("orders")
    .select("*,order_items(*),payments(*),order_status_history(*)")
    .order("created_at", { ascending: false })
    .limit(1000);

  return <AdminOrdersManager initialOrders={data ?? []} />;
}

export const dynamic = "force-dynamic";
