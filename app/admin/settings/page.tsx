import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsManager } from "@/components/admin/settings-manager";
export default async function AdminSettingsPage() { await requireAdmin(); const supabase = await createSupabaseServerClient(); const [settings, banners, faqs] = await Promise.all([supabase.from("site_settings").select("key,value"), supabase.from("banners").select("*").order("sort_order"), supabase.from("faqs").select("*").order("sort_order")]); const settingMap = Object.fromEntries((settings.data ?? []).map((row: any) => [row.key, row.value])); return <SettingsManager initialSettings={settingMap} initialBanners={banners.data ?? []} initialFaqs={faqs.data ?? []} />; }
export const dynamic = "force-dynamic";
