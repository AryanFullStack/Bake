import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ product_id: z.string().uuid() });
async function getContext() { const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const { supabase, user } = await getContext(); if (!user) return NextResponse.json({ error: "Sign in to use your wishlist" }, { status: 401 });
  const { data: wishlist, error: wishlistError } = await supabase.from("wishlists").upsert({ user_id: user.id }, { onConflict: "user_id" }).select("id").single();
  if (wishlistError) return NextResponse.json({ error: wishlistError.message }, { status: 400 });
  const { error } = await supabase.from("wishlist_items").upsert({ wishlist_id: wishlist.id, product_id: parsed.data.product_id }, { onConflict: "wishlist_id,product_id" });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const { supabase, user } = await getContext(); if (!user) return NextResponse.json({ error: "Sign in to use your wishlist" }, { status: 401 });
  const { data: wishlist } = await supabase.from("wishlists").select("id").eq("user_id", user.id).maybeSingle();
  if (wishlist) await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlist.id).eq("product_id", parsed.data.product_id);
  return NextResponse.json({ ok: true });
}
