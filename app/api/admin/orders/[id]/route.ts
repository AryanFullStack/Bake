import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const dbClient = createSupabaseAdminClient() ?? supabase;

  const { data: rawOrder, error } = await dbClient
    .from("orders")
    .select("*, order_items(*), payments(*), order_status_history(*), couriers(*)")
    .eq("id", id)
    .single();

  if (error || !rawOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let order = { ...rawOrder };
  if (order.order_status_history && order.order_status_history.length > 0) {
    const changedByIds = Array.from(
      new Set(
        order.order_status_history
          .map((h: any) => h.changed_by)
          .filter(Boolean)
      )
    );
    if (changedByIds.length > 0) {
      const { data: profileRows } = await dbClient
        .from("profiles")
        .select("id, full_name, role")
        .in("id", changedByIds);
      const profileMap = new Map((profileRows || []).map((p: any) => [p.id, p]));
      order.order_status_history = order.order_status_history.map((h: any) => ({
        ...h,
        profiles: h.changed_by ? profileMap.get(h.changed_by) || null : null,
      }));
    }
  }

  // Fetch customer lifetime stats if customer is linked or has phone
  let customerStats = { total_orders: 1, total_spent: Number(order.total), latest_order_date: order.created_at };
  if (order.user_id || order.customer_phone) {
    let statsQuery = dbClient.from("orders").select("id, total, created_at");
    if (order.user_id) {
      statsQuery = statsQuery.eq("user_id", order.user_id);
    } else {
      statsQuery = statsQuery.eq("customer_phone", order.customer_phone);
    }
    const { data: userOrders } = await statsQuery;
    if (userOrders && userOrders.length > 0) {
      customerStats = {
        total_orders: userOrders.length,
        total_spent: userOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        latest_order_date: userOrders.map((o) => o.created_at).sort().pop() ?? order.created_at,
      };
    }
  }

  return NextResponse.json({ order: { ...order, customer_stats: customerStats } });
}

const updateOrderSchema = z.object({
  status: z
    .enum(["placed", "confirmed", "processing", "baking", "ready", "out_for_delivery", "delivered", "cancelled", "returned"])
    .optional(),
  status_note: z.string().max(500).optional(),

  payment_status: z.enum(["pending", "pending_verification", "paid", "failed", "refunded"]).optional(),
  payment_notes: z.string().max(500).optional(),
  transaction_reference: z.string().max(200).optional(),

  courier_id: z.string().optional().nullable(),
  courier_name: z.string().optional().nullable(),
  tracking_number: z.string().optional().nullable(),
  tracking_url: z.string().optional().nullable(),
  dispatched_at: z.string().optional().nullable(),
  expected_delivery_at: z.string().optional().nullable(),
  delivery_notes: z.string().max(500).optional().nullable(),

  customer_name: z.string().min(2).optional(),
  customer_phone: z.string().min(7).optional(),
  customer_email: z.string().email().optional().or(z.literal("")).nullable(),
  city: z.string().min(2).optional(),
  area: z.string().min(2).optional(),
  delivery_address: z.string().min(5).optional(),
  landmark: z.string().optional().nullable(),
  delivery_instructions: z.string().optional().nullable(),

  admin_notes: z.string().max(1000).optional().nullable(),
  discount: z.number().nonnegative().optional(),
  delivery_fee: z.number().nonnegative().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const dbClient = createSupabaseAdminClient() ?? supabase;

  // Fetch current order state
  const { data: currentOrder, error: fetchErr } = await dbClient
    .from("orders")
    .select("*, payments(*)")
    .eq("id", id)
    .single();

  if (fetchErr || !currentOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderUpdates: Record<string, any> = {};

  // 1. Status Update
  if (parsed.data.status && parsed.data.status !== currentOrder.status) {
    orderUpdates.status = parsed.data.status;

    // Record in order status history
    await dbClient.from("order_status_history").insert({
      order_id: id,
      old_status: currentOrder.status,
      new_status: parsed.data.status,
      note: parsed.data.status_note || `Status updated to ${parsed.data.status.replace("_", " ")}`,
      changed_by: admin.user.id,
    });

    // Create user notification
    if (currentOrder.user_id) {
      await dbClient.from("notifications").insert({
        user_id: currentOrder.user_id,
        order_id: id,
        type: `order_${parsed.data.status}`,
        payload: {
          order_number: currentOrder.order_number,
          status: parsed.data.status,
          note: parsed.data.status_note || null,
        },
      });
    }

    // Insert outbox email event
    const recipientEmail = currentOrder.customer_email || null;
    if (recipientEmail) {
      await dbClient.from("email_outbox").insert({
        recipient: recipientEmail,
        template: `order_status_${parsed.data.status}`,
        payload: {
          order_number: currentOrder.order_number,
          customer_name: currentOrder.customer_name,
          new_status: parsed.data.status,
          note: parsed.data.status_note || null,
          tracking_number: currentOrder.tracking_number || parsed.data.tracking_number || null,
        },
        status: "pending",
      });
    }
  }

  // 2. Courier & Tracking Updates
  if (parsed.data.courier_id !== undefined) orderUpdates.courier_id = parsed.data.courier_id;
  if (parsed.data.courier_name !== undefined) orderUpdates.courier_name = parsed.data.courier_name;
  if (parsed.data.tracking_number !== undefined) orderUpdates.tracking_number = parsed.data.tracking_number;
  if (parsed.data.tracking_url !== undefined) orderUpdates.tracking_url = parsed.data.tracking_url;
  if (parsed.data.dispatched_at !== undefined) orderUpdates.dispatched_at = parsed.data.dispatched_at;
  if (parsed.data.expected_delivery_at !== undefined) orderUpdates.expected_delivery_at = parsed.data.expected_delivery_at;
  if (parsed.data.delivery_notes !== undefined) orderUpdates.delivery_notes = parsed.data.delivery_notes;

  // Auto populate courier name if courier_id provided
  if (parsed.data.courier_id && !parsed.data.courier_name) {
    const { data: courier } = await dbClient.from("couriers").select("name, tracking_url_template").eq("id", parsed.data.courier_id).maybeSingle();
    if (courier) {
      orderUpdates.courier_name = courier.name;
      if (courier.tracking_url_template && parsed.data.tracking_number) {
        orderUpdates.tracking_url = courier.tracking_url_template.replace("{tracking_number}", parsed.data.tracking_number);
      }
    }
  }

  // 3. Customer & Shipping Info Updates
  if (parsed.data.customer_name !== undefined) orderUpdates.customer_name = parsed.data.customer_name;
  if (parsed.data.customer_phone !== undefined) orderUpdates.customer_phone = parsed.data.customer_phone.replace(/\s+/g, "");
  if (parsed.data.customer_email !== undefined) orderUpdates.customer_email = parsed.data.customer_email;
  if (parsed.data.city !== undefined) orderUpdates.city = parsed.data.city;
  if (parsed.data.area !== undefined) orderUpdates.area = parsed.data.area;
  if (parsed.data.delivery_address !== undefined) orderUpdates.delivery_address = parsed.data.delivery_address;
  if (parsed.data.landmark !== undefined) orderUpdates.landmark = parsed.data.landmark;
  if (parsed.data.delivery_instructions !== undefined) orderUpdates.delivery_instructions = parsed.data.delivery_instructions;
  if (parsed.data.admin_notes !== undefined) orderUpdates.admin_notes = parsed.data.admin_notes;

  // 4. Financial Adjustments
  if (parsed.data.delivery_fee !== undefined || parsed.data.discount !== undefined) {
    const deliveryFee = parsed.data.delivery_fee !== undefined ? parsed.data.delivery_fee : Number(currentOrder.delivery_fee);
    const discount = parsed.data.discount !== undefined ? parsed.data.discount : Number(currentOrder.discount);
    const subtotal = Number(currentOrder.subtotal);

    orderUpdates.delivery_fee = deliveryFee;
    orderUpdates.discount = discount;
    orderUpdates.total = Math.max(0, subtotal + deliveryFee - discount);
  }

  // Perform order update if any field changed
  if (Object.keys(orderUpdates).length > 0) {
    const { error: updateErr } = await dbClient.from("orders").update(orderUpdates).eq("id", id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  // 5. Payment Table Updates
  if (
    parsed.data.payment_status !== undefined ||
    parsed.data.payment_notes !== undefined ||
    parsed.data.transaction_reference !== undefined
  ) {
    const paymentUpdates: Record<string, any> = {};
    if (parsed.data.payment_status !== undefined) {
      paymentUpdates.status = parsed.data.payment_status;
      if (parsed.data.payment_status === "paid") {
        paymentUpdates.verified_by = admin.user.id;
        paymentUpdates.verified_at = new Date().toISOString();
      }
    }
    if (parsed.data.payment_notes !== undefined) paymentUpdates.payment_notes = parsed.data.payment_notes;
    if (parsed.data.transaction_reference !== undefined) paymentUpdates.transaction_reference = parsed.data.transaction_reference;

    await dbClient.from("payments").update(paymentUpdates).eq("order_id", id);
  }

  // 6. Record Admin Activity
  await dbClient.from("admin_activity_logs").insert({
    actor_id: admin.user.id,
    action: "update_order",
    entity_type: "order",
    entity_id: id,
    metadata: { order_number: currentOrder.order_number, updates: orderUpdates },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const dbClient = createSupabaseAdminClient() ?? supabase;

  // Instead of hard deleting orders, set status to cancelled
  const { data: order } = await dbClient.from("orders").select("order_number, status").eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await dbClient.from("orders").update({ status: "cancelled" }).eq("id", id);
  await dbClient.from("order_status_history").insert({
    order_id: id,
    old_status: order.status,
    new_status: "cancelled",
    note: "Order cancelled by administrator",
    changed_by: admin.user.id,
  });

  await dbClient.from("admin_activity_logs").insert({
    actor_id: admin.user.id,
    action: "cancel_order",
    entity_type: "order",
    entity_id: id,
    metadata: { order_number: order.order_number },
  });

  return NextResponse.json({ ok: true });
}
