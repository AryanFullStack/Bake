import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createAdminOrderSchema = z.object({
  customer: z.object({
    user_id: z.string().optional().nullable(),
    full_name: z.string().trim().min(2, "Full name is required").max(120),
    phone: z.string().trim().min(7, "Phone number is required").max(30),
    email: z.string().trim().email().optional().or(z.literal("")).nullable(),
    city: z.string().trim().min(2, "City is required").max(80),
    area: z.string().trim().min(2, "Area is required").max(120),
    address: z.string().trim().min(5, "Address is required").max(500),
    landmark: z.string().max(160).optional().or(z.literal("")).nullable(),
    instructions: z.string().max(500).optional().or(z.literal("")).nullable(),
  }),
  items: z.array(
    z.object({
      product_id: z.string().min(1),
      variation_id: z.string().optional().nullable(),
      quantity: z.number().int().positive(),
      unit_price: z.number().nonnegative().optional(),
    })
  ).min(1, "Order must contain at least one item"),
  payment_method: z.enum(["cod", "bank_transfer", "card", "cash"]),
  payment_status: z.enum(["pending", "pending_verification", "paid", "failed", "refunded"]),
  discount: z.number().nonnegative().default(0),
  delivery_fee: z.number().nonnegative().default(0),
  courier_id: z.string().optional().nullable(),
  tracking_number: z.string().optional().nullable(),
  admin_notes: z.string().max(1000).optional().nullable(),
});

export async function POST(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createAdminOrderSchema.safeParse(body);
    if (!parsed.success) {
      const errs = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errs || "Invalid order parameters" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    let subtotal = 0;
    const validatedItems = [];

    // Fetch products & calculate totals
    for (const item of parsed.data.items) {
      const isUuid = UUID_REGEX.test(item.product_id);
      const { data: product } = isUuid
        ? await dbClient.from("products").select("*").eq("id", item.product_id).single()
        : await dbClient.from("products").select("*").or(`sku.eq.${item.product_id},slug.eq.${item.product_id}`).single();

      if (!product) {
        return NextResponse.json({ error: `Product not found (${item.product_id})` }, { status: 400 });
      }

      let unitPrice = item.unit_price !== undefined ? item.unit_price : Number(product.sale_price ?? product.price);
      let varTitle = product.name;
      let attributes = null;
      let sku = product.sku;
      let imagePath = product.featured_image;
      let validVariationId: string | null = null;

      if (product.product_type === "variable" && item.variation_id) {
        const { data: variation } = await dbClient
          .from("product_variations")
          .select("*")
          .eq("id", item.variation_id)
          .single();

        if (variation) {
          if (item.unit_price === undefined) {
            unitPrice = Number(variation.sale_price ?? variation.regular_price);
          }
          varTitle = variation.title || variation.name || product.name;
          attributes = variation.attributes;
          sku = variation.sku || product.sku;
          imagePath = variation.image_url || product.featured_image;
          validVariationId = variation.id;
        }
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        product_id: product.id,
        variation_id: validVariationId,
        variation_attributes: attributes,
        variation_title: varTitle,
        product_name: product.name,
        sku,
        image_path: imagePath,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
        is_variable: product.product_type === "variable",
      });
    }

    const deliveryFee = parsed.data.delivery_fee;
    const discount = parsed.data.discount;
    const total = Math.max(0, subtotal + deliveryFee - discount);
    const orderNumber = "BM-" + Math.floor(10000 + Math.random() * 90000);

    // Fetch courier name if courier_id passed
    let courierName: string | null = null;
    if (parsed.data.courier_id) {
      const { data: c } = await dbClient.from("couriers").select("name").eq("id", parsed.data.courier_id).maybeSingle();
      courierName = c?.name ?? null;
    }

    // Try database RPC for atomic transactional order creation
    const { data: rpcOrderNumber, error: rpcErr } = await supabase.rpc("create_admin_order", {
      p_customer: parsed.data.customer,
      p_items: parsed.data.items,
      p_payment_method: parsed.data.payment_method,
      p_payment_status: parsed.data.payment_status,
      p_discount: discount,
      p_delivery_fee: deliveryFee,
      p_courier_id: parsed.data.courier_id || null,
      p_tracking_number: parsed.data.tracking_number || null,
      p_admin_notes: parsed.data.admin_notes || null,
      p_created_by: admin.user.id,
    });

    if (!rpcErr && rpcOrderNumber) {
      return NextResponse.json({ ok: true, order_number: rpcOrderNumber });
    }

    // Fallback with explicit rollback if RPC is unavailable
    const { data: order, error: orderErr } = await dbClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: parsed.data.customer.user_id || null,
        customer_name: parsed.data.customer.full_name,
        customer_phone: parsed.data.customer.phone.replace(/\s+/g, ""),
        customer_email: parsed.data.customer.email || null,
        city: parsed.data.customer.city,
        area: parsed.data.customer.area,
        delivery_address: parsed.data.customer.address,
        landmark: parsed.data.customer.landmark || null,
        delivery_instructions: parsed.data.customer.instructions || null,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        payment_method: parsed.data.payment_method,
        status: "placed",
        courier_id: parsed.data.courier_id || null,
        courier_name: courierName,
        tracking_number: parsed.data.tracking_number || null,
        admin_notes: parsed.data.admin_notes || null,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: orderErr?.message || "Failed to create order" }, { status: 400 });
    }

    try {
      for (const item of validatedItems) {
        const { error: itemErr } = await dbClient.from("order_items").insert({
          order_id: order.id,
          product_id: item.product_id,
          variation_id: item.variation_id,
          variation_attributes: item.variation_attributes,
          variation_title: item.variation_title,
          image_path: item.image_path,
          product_name: item.product_name,
          sku: item.sku,
          unit_price: item.unit_price,
          quantity: item.quantity,
          line_total: item.line_total,
        });

        if (itemErr) throw new Error(`Item insert failed: ${itemErr.message}`);

        if (item.product_id) {
          if (item.is_variable && item.variation_id) {
            const { data: v } = await dbClient.from("product_variations").select("stock_quantity").eq("id", item.variation_id).single();
            if (v) {
              await dbClient.from("product_variations").update({ stock_quantity: Math.max(0, (v.stock_quantity ?? 0) - item.quantity) }).eq("id", item.variation_id);
            }
          } else {
            const { data: p } = await dbClient.from("products").select("stock_quantity").eq("id", item.product_id).single();
            if (p) {
              await dbClient.from("products").update({ stock_quantity: Math.max(0, (p.stock_quantity ?? 0) - item.quantity) }).eq("id", item.product_id);
            }
          }
        }
      }

      await dbClient.from("payments").insert({
        order_id: order.id,
        method: parsed.data.payment_method,
        status: parsed.data.payment_status,
        verified_by: parsed.data.payment_status === "paid" ? admin.user.id : null,
        verified_at: parsed.data.payment_status === "paid" ? new Date().toISOString() : null,
      });

      await dbClient.from("order_status_history").insert({
        order_id: order.id,
        new_status: "placed",
        note: "Order manually created by staff",
        changed_by: admin.user.id,
      });

      await dbClient.from("admin_activity_logs").insert({
        actor_id: admin.user.id,
        action: "create_manual_order",
        entity_type: "order",
        entity_id: order.id,
        metadata: { order_number: orderNumber, total, customer_name: parsed.data.customer.full_name },
      });

      return NextResponse.json({ ok: true, id: order.id, order_number: orderNumber });
    } catch (itemException: any) {
      // Rollback orphaned order header to prevent 0-item order records
      await dbClient.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemException?.message || "Order item insertion failed. Order rolled back." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create order" }, { status: 500 });
  }
}
