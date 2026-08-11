import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = z.object({ product_id: z.string().uuid() }).safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ ok: true });
  const { error } = await supabase.from("recently_viewed").upsert({ user_id: user.id, product_id: parsed.data.product_id, viewed_at: new Date().toISOString() }, { onConflict: "user_id,product_id" });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
