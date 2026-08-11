import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function PATCH(request: Request) { const admin = await assertAdminApi(); if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 }); const parsed = z.object({ id: z.string().uuid(), role: z.enum(["customer", "admin", "manager", "fulfilment"]) }).safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid customer update" }, { status: 400 }); const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id); return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true }); }
