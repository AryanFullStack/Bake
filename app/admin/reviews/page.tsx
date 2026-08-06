import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminReviewsManager } from "@/components/admin/reviews-manager";
export default async function AdminReviewsPage() { await requireAdmin(); const supabase = await createSupabaseServerClient(); const { data } = await supabase.from("reviews").select("id,rating,body,is_approved,created_at,products(name),profiles(full_name)").order("created_at", { ascending: false }).limit(1000); return <AdminReviewsManager initialReviews={data ?? []} />; }
export const dynamic = "force-dynamic";
