import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddressesManager } from "@/components/account/addresses-manager";
export default async function AddressesPage() { const user = await getCurrentUser(); if (!user) redirect("/login?next=/account/addresses"); const supabase = await createSupabaseServerClient(); const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }); return <div className="container-shell py-12 md:py-16"><Link href="/account" className="text-sm font-bold text-orange">← Account</Link><h1 className="mt-4 text-5xl font-bold text-navy">Saved addresses</h1><div className="mt-8"><AddressesManager initialAddresses={data ?? []} /></div></div>; }
export const dynamic = "force-dynamic";
