import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uploadCakeImageToImageKit } from "@/lib/custom-cake-media";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const requestId = form.get("request_id") as string;
    const phoneOrEmail = form.get("phone_or_email") as string;
    const method = (form.get("method") as string) || "bank_transfer";
    const transactionReference = form.get("transaction_reference") as string;
    const amountPaid = form.get("amount_paid") as string;
    const proofFile = form.get("proof") as File | null;

    if (!requestId || !phoneOrEmail) {
      return NextResponse.json({ error: "Missing required identification details" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient() ?? supabase;

    // Verify ownership
    const { data: cakeRow, error: cErr } = await admin
      .from("custom_cake_requests")
      .select("*, custom_cake_quotes(*)")
      .eq("id", requestId)
      .single();

    if (cErr || !cakeRow) {
      return NextResponse.json({ error: "Custom cake request not found" }, { status: 404 });
    }

    const phoneDigits = phoneOrEmail.replace(/\D/g, "");
    const cakeDigits = (cakeRow.phone || "").replace(/\D/g, "");
    const isEmailMatch = cakeRow.email && cakeRow.email.toLowerCase() === phoneOrEmail.toLowerCase();
    const isPhoneMatch = phoneDigits.length >= 7 && (cakeDigits.endsWith(phoneDigits) || phoneDigits.endsWith(cakeDigits));

    if (!isEmailMatch && !isPhoneMatch) {
      return NextResponse.json({ error: "Unauthorized verification check failed" }, { status: 403 });
    }

    let proofUrl = "";
    if (proofFile && proofFile instanceof File && proofFile.size > 0) {
      try {
        const uploadRes = await uploadCakeImageToImageKit(proofFile, "payment-receipts");
        proofUrl = uploadRes.url;
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || "Failed to process payment receipt image. Please upload a valid JPG, PNG, or WebP." },
          { status: 400 }
        );
      }
    }

    const parsedAmount = Math.max(0, Number(amountPaid || 0));

    // Update request payment information
    try {
      await admin
        .from("custom_cake_requests")
        .update({
          payment_method: method,
          payment_status: "awaiting_verification",
          payment_reference: transactionReference || null,
          payment_proof_url: proofUrl || null,
          amount_paid: parsedAmount || cakeRow.amount_paid || 0,
        })
        .eq("id", requestId);
    } catch {
      // Ignored if direct columns are pending
    }

    // Try inserting into custom_cake_payments table
    try {
      await admin.from("custom_cake_payments").insert({
        request_id: requestId,
        method,
        status: "awaiting_verification",
        amount: parsedAmount,
        transaction_reference: transactionReference || null,
        proof_url: proofUrl || null,
        notes: `Submitted by customer (${method.toUpperCase()})`,
      });
    } catch {
      // Ignored if table not created
    }

    // Record status history entry
    await admin.from("custom_cake_status_history").insert({
      request_id: requestId,
      old_status: cakeRow.status,
      new_status: cakeRow.status,
      note: `Payment proof submitted via ${method.toUpperCase()}. Ref: ${transactionReference || "None"} | Amount: PKR ${parsedAmount}. Awaiting admin verification.`,
    });

    return NextResponse.json({
      success: true,
      status: "awaiting_verification",
      proof_url: proofUrl,
      message: "Payment proof received. Our team will verify and begin production shortly.",
    });
  } catch (err: any) {
    console.error("[POST /api/custom-cake/payment error]:", err);
    return NextResponse.json({ error: err.message || "Failed to submit payment proof" }, { status: 500 });
  }
}

