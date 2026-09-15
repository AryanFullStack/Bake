import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  parseCakeSpecifications,
  parseQuotationBreakdown,
  calculateQuotation,
  encodeQuotationNote,
  STATUS_LABELS,
} from "@/lib/custom-cake";
import { resolveCakeImageUrl } from "@/lib/custom-cake-media";

export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(5, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("payment_status") || "";
    const deliveryFilter = searchParams.get("delivery_filter") || "";
    const sortBy = searchParams.get("sort_by") || "newest";

    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient() ?? supabase;

    let query = adminClient
      .from("custom_cake_requests")
      .select(
        "*, custom_cake_quotes(*), custom_cake_images(*), custom_cake_status_history(*), orders:linked_order_id(id, order_number, status)",
        { count: "exact" }
      );

    if (search) {
      query = query.or(
        `request_number.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (paymentStatus && paymentStatus !== "all") {
      query = query.eq("payment_status", paymentStatus);
    }

    // Delivery date filtering
    if (deliveryFilter && deliveryFilter !== "all") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59).toISOString();
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59).toISOString();

      if (deliveryFilter === "today") {
        query = query.gte("preferred_delivery_at", todayStart).lte("preferred_delivery_at", todayEnd);
      } else if (deliveryFilter === "tomorrow") {
        query = query.gte("preferred_delivery_at", tomorrowStart).lte("preferred_delivery_at", tomorrowEnd);
      } else if (deliveryFilter === "this_week") {
        query = query.gte("preferred_delivery_at", todayStart).lte("preferred_delivery_at", weekEnd);
      } else if (deliveryFilter === "upcoming") {
        query = query.gte("preferred_delivery_at", todayStart);
      } else if (deliveryFilter === "overdue") {
        query = query.lt("preferred_delivery_at", todayStart).not("status", "in", '("delivered","completed","cancelled","rejected")');
      }
    }

    // Sorting
    if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sortBy === "delivery_soonest") {
      query = query.order("preferred_delivery_at", { ascending: true, nullsFirst: false });
    } else if (sortBy === "budget_highest") {
      query = query.order("budget", { ascending: false, nullsFirst: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: rawRequests, count, error } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const requests = (rawRequests || []).map((row: any) => {
      const quoteRow = Array.isArray(row.custom_cake_quotes)
        ? row.custom_cake_quotes[0]
        : row.custom_cake_quotes;
      const quote = parseQuotationBreakdown(quoteRow, row);
      const specs = parseCakeSpecifications(row);

      const images = (row.custom_cake_images || []).map((img: any) => ({
        id: img.id,
        url: resolveCakeImageUrl(img.storage_path),
        created_at: img.created_at,
      }));

      const history = (row.custom_cake_status_history || []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return {
        ...row,
        specs,
        quote,
        images,
        history,
        linked_order: row.orders || null,
      };
    });

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch custom cake requests" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await assertAdminApi();
    if (!admin) return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Request ID is required" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient() ?? supabase;

    const { data: cake, error: fetchErr } = await adminClient
      .from("custom_cake_requests")
      .select("*, custom_cake_quotes(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !cake) {
      return NextResponse.json({ error: "Custom cake request not found" }, { status: 404 });
    }

    const existingQuote = Array.isArray(cake.custom_cake_quotes)
      ? cake.custom_cake_quotes[0]
      : cake.custom_cake_quotes;

    // 1. Status Update
    if (body.status && body.status !== cake.status) {
      const newStatus = body.status;
      const statusNote = body.status_note || body.note || null;

      await adminClient
        .from("custom_cake_requests")
        .update({ status: newStatus })
        .eq("id", id);

      await adminClient.from("custom_cake_status_history").insert({
        request_id: id,
        old_status: cake.status,
        new_status: newStatus,
        note: statusNote,
        changed_by: admin.user.id,
      });

      // Notification / Email event
      if (cake.email) {
        try {
          await adminClient.from("email_outbox").insert({
            recipient: cake.email,
            template: `custom_cake_status_${newStatus}`,
            payload: {
              request_number: cake.request_number,
              customer_name: cake.customer_name,
              new_status: newStatus,
              note: statusNote,
            },
            status: "pending",
          });
        } catch {
          // non-blocking
        }
      }
    }

    // 2. Quotation Update
    if (body.quotation || body.base_price !== undefined || body.amount !== undefined) {
      const q = body.quotation || body;
      const basePrice = Number(q.base_price ?? q.amount ?? 0);
      const designCharges = Number(q.design_charges ?? 0);
      const tierCharges = Number(q.tier_charges ?? 0);
      const extraCharges = Number(q.extra_charges ?? 0);
      const deliveryFee = Number(q.delivery_fee ?? 0);
      const discount = Number(q.discount ?? 0);

      const calculated = calculateQuotation({
        base_price: basePrice,
        design_charges: designCharges,
        tier_charges: tierCharges,
        extra_charges: extraCharges,
        delivery_fee: deliveryFee,
        discount,
        deposit_amount: q.deposit_amount,
        amount_paid: cake.amount_paid,
      });

      const noteText = q.note || "";
      const encodedNote = encodeQuotationNote(noteText, {
        base_price: calculated.base_price,
        design_charges: calculated.design_charges,
        tier_charges: calculated.tier_charges,
        extra_charges: calculated.extra_charges,
        delivery_fee: calculated.delivery_fee,
        discount: calculated.discount,
        customer_notes: existingQuote?.customer_notes,
        decline_reason: existingQuote?.decline_reason,
      });

      const quoteUpsertData: any = {
        request_id: id,
        amount: calculated.final_price,
        deposit_amount: calculated.deposit_amount || null,
        delivery_fee: calculated.delivery_fee,
        note: encodedNote,
        status: q.status || "pending",
        created_by: admin.user.id,
      };

      if (q.expires_at) {
        quoteUpsertData.expires_at = q.expires_at;
      }

      await adminClient
        .from("custom_cake_quotes")
        .upsert(quoteUpsertData, { onConflict: "request_id" });

      // Update deposit_required and remaining_balance on cake request if columns exist
      try {
        await adminClient
          .from("custom_cake_requests")
          .update({
            deposit_required: calculated.deposit_amount,
            remaining_balance: calculated.remaining_balance,
            status: cake.status === "submitted" ? "quotation_prepared" : cake.status,
          })
          .eq("id", id);
      } catch {
        // ignore
      }

      // If status transitioned to quotation_prepared
      if (cake.status === "submitted" || body.notify_quote) {
        await adminClient.from("custom_cake_status_history").insert({
          request_id: id,
          old_status: cake.status,
          new_status: "quotation_prepared",
          note: `Quotation prepared: PKR ${calculated.final_price} (Deposit required: PKR ${calculated.deposit_amount})`,
          changed_by: admin.user.id,
        });

        if (cake.email) {
          try {
            await adminClient.from("email_outbox").insert({
              recipient: cake.email,
              template: "custom_cake_quotation_prepared",
              payload: {
                request_number: cake.request_number,
                customer_name: cake.customer_name,
                final_price: calculated.final_price,
                deposit_amount: calculated.deposit_amount,
                note: noteText,
              },
              status: "pending",
            });
          } catch {
            // non-blocking
          }
        }
      }
    }

    // 3. Payment Update
    if (body.payment_status || body.payment_method || body.amount_paid !== undefined) {
      const updates: any = {};
      if (body.payment_method) updates.payment_method = body.payment_method;
      if (body.payment_status) updates.payment_status = body.payment_status;
      if (body.amount_paid !== undefined) updates.amount_paid = Number(body.amount_paid);
      if (body.payment_reference) updates.payment_reference = body.payment_reference;

      try {
        await adminClient.from("custom_cake_requests").update(updates).eq("id", id);
      } catch {
        // ignore
      }

      // Record in history if payment was verified or modified
      if (body.payment_status && body.payment_status !== cake.payment_status) {
        const pNote = `Payment status updated to ${body.payment_status.toUpperCase()} by staff. Note: ${body.payment_note || "No note"}`;

        await adminClient.from("custom_cake_status_history").insert({
          request_id: id,
          old_status: cake.status,
          new_status: body.payment_status === "verified" ? "in_production" : cake.status,
          note: pNote,
          changed_by: admin.user.id,
        });

        if (body.payment_status === "verified") {
          try {
            await adminClient
              .from("custom_cake_requests")
              .update({ status: "in_production" })
              .eq("id", id);
          } catch {
            // ignore
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Custom cake request updated successfully" });
  } catch (err: any) {
    console.error("[PATCH /api/admin/custom-cakes error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update custom cake request" },
      { status: 500 }
    );
  }
}
