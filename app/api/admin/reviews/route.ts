import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function PATCH(request: Request) { const admin = await assertAdminApi(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 }); const parsed = z.object({ id: z.string().uuid(), is_approved: z.boolean() }).safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 }); const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("reviews").update({ is_approved: parsed.data.is_approved }).eq("id", parsed.data.id); return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true }); }
