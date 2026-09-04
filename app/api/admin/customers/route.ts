import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = z
    .object({
      id: z.string().uuid(),
      role: z.enum(["customer", "admin", "manager", "fulfilment"]),
    })
    .safeParse(await request.json());

  if (!parsed.success) return NextResponse.json({ error: "Invalid customer update" }, { status: 400 });

  const adminClient = createSupabaseAdminClient();
  const db = adminClient ?? (await createSupabaseServerClient());

  const { error } = await db.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (adminClient) {
    try {
      await adminClient.auth.admin.updateUserById(parsed.data.id, {
        user_metadata: { role: parsed.data.role },
        app_metadata: { role: parsed.data.role },
      });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true });
}

