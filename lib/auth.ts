import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("id,full_name,phone,role").eq("id", user.id).maybeSingle();
  return { user, profile };
}

export async function requireAdmin() {
  const result = await getCurrentProfile();
  if (!result.user) redirect("/login?next=/admin");
  if (!result.profile || !["admin", "manager", "fulfilment"].includes(result.profile.role)) redirect("/account");
  return result as { user: NonNullable<typeof result.user>; profile: NonNullable<typeof result.profile> };
}

export async function assertAdminApi() {
  const result = await getCurrentProfile();
  if (!result.user || !result.profile || !["admin", "manager", "fulfilment"].includes(result.profile.role)) return null;
  return result;
}
