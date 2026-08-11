import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminCustomCakesManager } from "@/components/admin/custom-cakes-manager";
export default async function AdminCustomCakesPage() { await requireAdmin(); const supabase = await createSupabaseServerClient(); const { data } = await supabase.from("custom_cake_requests").select("*,custom_cake_quotes(*)").order("created_at", { ascending: false }).limit(1000); return <AdminCustomCakesManager initialRequests={data ?? []} />; }
export const dynamic = "force-dynamic";
