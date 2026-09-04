import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SUPERADMIN_EMAIL = "aryanwaheednew@gmail.com";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const isSuperAdmin = user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();

  const adminClient = createSupabaseAdminClient();
  const db = adminClient ?? supabase;

  let { data: profile } = await db
    .from("profiles")
    .select("id,full_name,phone,role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const roleFromMeta = isSuperAdmin
      ? "admin"
      : ((user.user_metadata?.role || user.app_metadata?.role || "customer") as string);
    const nameFromMeta = (user.user_metadata?.full_name || (isSuperAdmin ? "Admin" : "")) as string;
    const { data: newProfile } = await db
      .from("profiles")
      .upsert({ id: user.id, full_name: nameFromMeta, role: roleFromMeta })
      .select("id,full_name,phone,role")
      .maybeSingle();
    profile = newProfile || { id: user.id, full_name: nameFromMeta, phone: null, role: roleFromMeta };
  }

  if (isSuperAdmin && profile && profile.role !== "admin") {
    profile = { ...profile, role: "admin" };
  }

  return { user, profile };
}

export async function requireAdmin() {
  const result = await getCurrentProfile();
  if (!result.user) redirect("/login?next=/admin");

  const isSuperAdmin = result.user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
  const isRoleAdmin = result.profile && ["admin", "manager", "fulfilment"].includes(result.profile.role);
  const isMetaAdmin =
    ["admin", "manager", "fulfilment"].includes(result.user.user_metadata?.role) ||
    ["admin", "manager", "fulfilment"].includes(result.user.app_metadata?.role);

  if (!isSuperAdmin && !isRoleAdmin && !isMetaAdmin) redirect("/account");
  return result as { user: NonNullable<typeof result.user>; profile: NonNullable<typeof result.profile> };
}

export async function assertAdminApi() {
  const result = await getCurrentProfile();
  if (!result.user) return null;

  const isSuperAdmin = result.user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
  const isRoleAdmin = result.profile && ["admin", "manager", "fulfilment"].includes(result.profile.role);
  const isMetaAdmin =
    ["admin", "manager", "fulfilment"].includes(result.user.user_metadata?.role) ||
    ["admin", "manager", "fulfilment"].includes(result.user.app_metadata?.role);

  if (!isSuperAdmin && !isRoleAdmin && !isMetaAdmin) return null;
  return result;
}


