import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    const { request_id } = body;
    if (!request_id) return NextResponse.json({ error: "Custom cake request ID is required" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    // 1. Try database RPC first for atomic transaction
    const { data: rpcOrderNum, error: rpcErr } = await supabase.rpc("convert_custom_cake_to_order", {
      p_request_id: request_id,
      p_admin_id: admin.user.id,
    });

    if (!rpcErr && rpcOrderNum) {
      return NextResponse.json({ ok: true, order_number: rpcOrderNum });
    }

    // Fallback logic if RPC is unavailable
    const { data: reqData, error: reqErr } = await dbClient
      .from("custom_cake_requests")
      .select("*, custom_cake_quotes(*)")
      .eq("id", request_id)
      .single();

    if (reqErr || !reqData) {
      return NextResponse.json({ error: "Custom cake request not found" }, { status: 404 });
    }

    const quote = Array.isArray(reqData.custom_cake_quotes) ? reqData.custom_cake_quotes[0] : reqData.custom_cake_quotes;
    if (!quote) {
      return NextResponse.json({ error: "Please prepare a quotation before converting to order" }, { status: 400 });
    }

    const orderNumber = "BM-" + Math.floor(10000 + Math.random() * 90000);
    const amount = Number(quote.amount || 0);
    const deliveryFee = Number(quote.delivery_fee || 0);
    const grandTotal = amount + deliveryFee;

    // Insert Order
    const { data: newOrder, error: orderErr } = await dbClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: reqData.user_id || null,
        customer_name: reqData.customer_name,
        customer_phone: reqData.phone.replace(/\s+/g, ""),
        customer_email: reqData.email || null,
        city: reqData.city,
        area: reqData.area,
        delivery_address: reqData.delivery_address,
        landmark: reqData.landmark || null,
        delivery_instructions: reqData.delivery_instructions || null,
        preferred_delivery_at: reqData.preferred_delivery_at || null,
        subtotal: amount,
        delivery_fee: deliveryFee,
        discount: 0,
        total: grandTotal,
        payment_method: "cod",
        status: "confirmed",
        admin_notes: `Converted from Custom Cake Request #${reqData.request_number}`,
      })
      .select("id")
      .single();

    if (orderErr || !newOrder) {
      return NextResponse.json({ error: orderErr?.message || "Failed to convert to order" }, { status: 400 });
    }

    // Insert Line Item
    await dbClient.from("order_items").insert({
      order_id: newOrder.id,
      product_name: `Custom Cake: ${reqData.cake_type}`,
      sku: `CC-${reqData.request_number}`,
      unit_price: amount,
      quantity: reqData.quantity || 1,
      line_total: amount,
      variation_title: `Size: ${reqData.cake_size} | Flavour: ${reqData.flavor}`,
    });

    // Insert Payment & History
    await dbClient.from("payments").insert({
      order_id: newOrder.id,
      method: "cod",
      status: quote.deposit_amount ? "pending_verification" : "pending",
      note: quote.deposit_amount ? `Deposit Required: PKR ${quote.deposit_amount}` : null,
    });

    await dbClient.from("order_status_history").insert({
      order_id: newOrder.id,
      new_status: "confirmed",
      note: `Converted from custom cake request #${reqData.request_number}`,
      changed_by: admin.user.id,
    });

    // Update Request status & link
    await dbClient.from("custom_cake_requests").update({
      linked_order_id: newOrder.id,
      status: "confirmed",
    }).eq("id", request_id);

    await dbClient.from("custom_cake_status_history").insert({
      request_id: request_id,
      old_status: reqData.status,
      new_status: "confirmed",
      note: `Converted to Order #${orderNumber}`,
      changed_by: admin.user.id,
    });

    return NextResponse.json({ ok: true, order_number: orderNumber, order_id: newOrder.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Conversion failed" }, { status: 500 });
  }
}
