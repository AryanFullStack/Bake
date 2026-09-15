import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const actionSchema = z.object({
  request_id: z.string().uuid(),
  phone_or_email: z.string().min(3),
  action: z.enum(["accept", "request_changes", "decline"]),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quotation response" }, { status: 400 });
    }

    const { request_id, phone_or_email, action, notes } = parsed.data;

    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient() ?? supabase;

    // Verify request ownership by phone or email
    const { data: cakeRow, error: cErr } = await admin
      .from("custom_cake_requests")
      .select("*, custom_cake_quotes(*)")
      .eq("id", request_id)
      .single();

    if (cErr || !cakeRow) {
      return NextResponse.json({ error: "Custom cake request not found" }, { status: 404 });
    }

    const phoneDigits = phone_or_email.replace(/\D/g, "");
    const cakeDigits = (cakeRow.phone || "").replace(/\D/g, "");
    const isEmailMatch = cakeRow.email && cakeRow.email.toLowerCase() === phone_or_email.toLowerCase();
    const isPhoneMatch = phoneDigits.length >= 7 && (cakeDigits.endsWith(phoneDigits) || phoneDigits.endsWith(cakeDigits));

    if (!isEmailMatch && !isPhoneMatch) {
      return NextResponse.json({ error: "Unauthorized verification check failed" }, { status: 403 });
    }

    const quote = Array.isArray(cakeRow.custom_cake_quotes)
      ? cakeRow.custom_cake_quotes[0]
      : cakeRow.custom_cake_quotes;

    if (!quote) {
      return NextResponse.json({ error: "Quotation has not been prepared yet" }, { status: 400 });
    }

    let newStatus: string = cakeRow.status;
    let quoteStatus: string = quote.status;
    let historyNote = "";

    const deposit = Number(quote.deposit_amount || 0);

    if (action === "accept") {
      quoteStatus = "accepted";
      newStatus = deposit > 0 ? "deposit_pending" : "confirmed";
      historyNote = deposit > 0
        ? `Quotation accepted by customer. Deposit of PKR ${deposit} pending.`
        : `Quotation accepted by customer. Order confirmed for production.`;
    } else if (action === "request_changes") {
      quoteStatus = "changes_requested";
      newStatus = "under_review";
      historyNote = `Customer requested changes: ${notes || "No additional comments"}`;
    } else if (action === "decline") {
      quoteStatus = "declined";
      newStatus = "cancelled";
      historyNote = `Customer declined quotation: ${notes || "No reason specified"}`;
    }

    // Update quote
    await admin
      .from("custom_cake_quotes")
      .update({
        status: quoteStatus,
        decided_at: new Date().toISOString(),
      })
      .eq("request_id", request_id);

    // Update request
    await admin
      .from("custom_cake_requests")
      .update({ status: newStatus })
      .eq("id", request_id);

    // Insert status history
    await admin.from("custom_cake_status_history").insert({
      request_id,
      old_status: cakeRow.status,
      new_status: newStatus,
      note: historyNote,
    });

    return NextResponse.json({
      success: true,
      new_status: newStatus,
      quote_status: quoteStatus,
      message: historyNote,
    });
  } catch (err: any) {
    console.error("[POST /api/custom-cake/quote error]:", err);
    return NextResponse.json({ error: err.message || "Failed to process quotation action" }, { status: 500 });
  }
}

