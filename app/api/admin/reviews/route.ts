import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureReviewSchema } from "@/lib/supabase/schema-runner";

const adminActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "hide", "delete", "update_note"]),
  admin_note: z.string().trim().optional(),
});

export async function PATCH(request: Request) {
  try {
    await ensureReviewSchema();
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action parameters" }, { status: 400 });
    }

    const { id, action, admin_note } = parsed.data;
    const supabase = await createSupabaseServerClient();

    // Fetch target review first for logging metadata
    const { data: existingReview, error: fetchErr } = await supabase
      .from("reviews")
      .select("id, product_id, order_id, rating, body, status, is_approved, reviewer_name, admin_note, products(name)")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    let updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    let logActionName = `review.${action}`;

    if (action === "approve") {
      updatePayload.status = "approved";
      updatePayload.is_approved = true;
    } else if (action === "reject") {
      updatePayload.status = "rejected";
      updatePayload.is_approved = false;
    } else if (action === "hide") {
      updatePayload.status = "hidden";
      updatePayload.is_approved = false;
    }

    if (admin_note !== undefined) {
      updatePayload.admin_note = admin_note;
    }

    if (action === "delete") {
      const { error: delErr } = await supabase.from("reviews").delete().eq("id", id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 400 });
      }
    } else {
      const { error: updateErr } = await supabase.from("reviews").update(updatePayload).eq("id", id);
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    }

    // Record action in admin_activity_logs
    try {
      await supabase.from("admin_activity_logs").insert({
        actor_id: admin.user.id,
        action: logActionName,
        entity_type: "review",
        entity_id: id,
        metadata: {
          product_name: (existingReview.products as any)?.name ?? "Unknown Product",
          reviewer_name: existingReview.reviewer_name,
          rating: existingReview.rating,
          previous_status: existingReview.status,
          new_status: updatePayload.status ?? existingReview.status,
          admin_note: admin_note ?? (existingReview as any).admin_note ?? null,
        },
      });
    } catch (logErr) {
      console.warn("[Admin Activity Log Warning]:", logErr);
    }

    return NextResponse.json({ ok: true, action, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
