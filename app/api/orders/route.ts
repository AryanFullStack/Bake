import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const orderSchema = z.object({
  customer: z.object({
    full_name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(30),
    email: z.string().trim().email().optional().or(z.literal("")),
    city: z.string().trim().min(2).max(80),
    area: z.string().trim().min(2).max(120),
    address: z.string().trim().min(8).max(500),
    landmark: z.string().max(160).optional(),
    instructions: z.string().max(500).optional(),
  }),
  payment_method: z.enum(["cod", "bank_transfer"]),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      variation_id: z.string().uuid().optional(),
      quantity: z.number().int().positive().max(100),
    })
  ).min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid order details" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  
  // Try database RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_guest_order", {
    p_customer: parsed.data.customer,
    p_payment_method: parsed.data.payment_method,
    p_items: parsed.data.items,
  });

  if (!rpcError && rpcData) {
    return NextResponse.json({ order_number: rpcData });
  }

  console.warn("RPC create_guest_order error, falling back to direct server order creation:", rpcError?.message);

  const dbClient = createSupabaseAdminClient() ?? supabase;

  try {
    let subtotal = 0;
    const validatedItems = [];

    // Calculate subtotal and validate items
    for (const item of parsed.data.items) {
      const { data: product } = await dbClient
        .from("products")
        .select("*")
        .eq("id", item.product_id)
        .eq("is_published", true)
        .maybeSingle();

      if (!product) {
        return NextResponse.json({ error: "One or more items in your cart are no longer available." }, { status: 400 });
      }

      let unitPrice = Number(product.sale_price ?? product.price);
      let varTitle = product.name;
      let attributes = null;
      let sku = product.sku;
      let imagePath = product.featured_image;

      if (product.product_type === "variable") {
        if (!item.variation_id) {
          return NextResponse.json({ error: `Please select all options for ${product.name}` }, { status: 400 });
        }
        const { data: variation } = await dbClient
          .from("product_variations")
          .select("*")
          .eq("id", item.variation_id)
          .eq("product_id", product.id)
          .eq("status", "active")
          .maybeSingle();

        if (!variation || (variation.stock_quantity ?? 0) < item.quantity) {
          return NextResponse.json({ error: `Selected options for ${product.name} are unavailable.` }, { status: 400 });
        }

        unitPrice = Number(variation.sale_price ?? variation.regular_price);
        varTitle = variation.title || variation.name || product.name;
        attributes = variation.attributes;
        sku = variation.sku || product.sku;
        imagePath = variation.image_url || product.featured_image;
      } else {
        if ((product.stock_quantity ?? 0) < item.quantity) {
          return NextResponse.json({ error: `${product.name} is out of stock.` }, { status: 400 });
        }
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        product_id: product.id,
        variation_id: item.variation_id || null,
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

    const deliveryFee = subtotal >= 3000 || subtotal === 0 ? 0 : 250;
    const orderNumber = "BM-" + Math.floor(10000 + Math.random() * 90000);

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id ?? null;

    // 1. Create order
    const { data: order, error: orderErr } = await dbClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
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
        total: subtotal + deliveryFee,
        payment_method: parsed.data.payment_method,
        status: "placed",
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("Order insertion error:", orderErr);
      return NextResponse.json({ error: orderErr?.message ?? "Failed to save order." }, { status: 400 });
    }

    // 2. Create order items & adjust stock
    for (const item of validatedItems) {
      await dbClient.from("order_items").insert({
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

    // 3. Create payment entry
    const paymentStatus = parsed.data.payment_method === "bank_transfer" ? "pending_verification" : "pending";
    await dbClient.from("payments").insert({
      order_id: order.id,
      method: parsed.data.payment_method,
      status: paymentStatus,
    });

    // 4. Create order status history
    await dbClient.from("order_status_history").insert({
      order_id: order.id,
      new_status: "placed",
    });

    return NextResponse.json({ order_number: orderNumber });
  } catch (err: any) {
    console.error("Order fallback exception:", err);
    return NextResponse.json({ error: err?.message || "Failed to process order." }, { status: 500 });
  }
}

