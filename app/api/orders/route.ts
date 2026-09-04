import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActiveDeals, calculateProductDealPrice } from "@/lib/deals";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const checkoutSchema = z.object({
  customer: z.object({
    full_name: z.string().min(2, "Full name is required"),
    phone: z.string().min(10, "Phone number is required"),
    email: z.string().email().optional().or(z.literal("")),
    city: z.string().min(1, "City is required"),
    area: z.string().min(2, "Area/Sector is required"),
    address: z.string().min(5, "Delivery address is required"),
    landmark: z.string().optional(),
    instructions: z.string().optional(),
  }),
  payment_method: z.enum(["cod", "bank_transfer", "jazzcash", "easypaisa"]),
  items: z.array(
    z.object({
      product_id: z.string(),
      variation_id: z.string().optional().nullable(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Cart cannot be empty"),
});

/**
 * Saves or updates the delivery address to the customer's profile after checkout
 */
async function autoSaveCustomerAddress(dbClient: any, userId: string, customer: any) {
  try {
    const { data: existingAddresses } = await dbClient
      .from("addresses")
      .select("id, is_default")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });

    if (!existingAddresses || existingAddresses.length === 0) {
      await dbClient.from("addresses").insert({
        user_id: userId,
        label: "Home",
        full_name: customer.full_name,
        phone: customer.phone.replace(/\s+/g, ""),
        city: customer.city,
        area: customer.area,
        address: customer.address,
        landmark: customer.landmark || null,
        instructions: customer.instructions || null,
        is_default: true,
      });
    } else {
      const targetId = existingAddresses[0].id;
      await dbClient
        .from("addresses")
        .update({
          full_name: customer.full_name,
          phone: customer.phone.replace(/\s+/g, ""),
          city: customer.city,
          area: customer.area,
          address: customer.address,
          landmark: customer.landmark || null,
          instructions: customer.instructions || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId)
        .eq("user_id", userId);
    }
  } catch (err) {
    console.error("Failed to auto-save customer address to profile:", err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();
    const dbClient = adminClient ?? supabase;

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    const allItemsAreUuid = parsed.data.items.every((i) => UUID_REGEX.test(i.product_id));

    // Try database RPC first if all product IDs are valid UUIDs
    if (allItemsAreUuid) {
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_guest_order", {
        p_customer: parsed.data.customer,
        p_payment_method: parsed.data.payment_method,
        p_items: parsed.data.items,
      });

      if (!rpcError && rpcData) {
        if (user?.id) {
          await autoSaveCustomerAddress(dbClient, user.id, parsed.data.customer);
        }
        return NextResponse.json({ ok: true, order_number: rpcData });
      }

      if (
        rpcError &&
        rpcError.message &&
        !rpcError.message.includes("function") &&
        !rpcError.message.includes("does not exist")
      ) {
        console.error("RPC order creation error:", rpcError.message);
        return NextResponse.json({ error: rpcError.message }, { status: 400 });
      }
    }

    // Fallback: Validate product details & calculate trusted server pricing
    let subtotal = 0;
    const activeDeals = await getActiveDeals();

    const validatedItems: Array<{
      product_id: string | null;
      variation_id: string | null;
      variation_attributes: any;
      variation_title?: string;
      product_name: string;
      sku?: string;
      image_path?: string;
      unit_price: number;
      quantity: number;
      line_total: number;
      is_variable: boolean;
      deal_id?: string | null;
      deal_name?: string | null;
      regular_price?: number;
      discount_amount?: number;
    }> = [];

    for (const item of parsed.data.items) {
      const isUuid = UUID_REGEX.test(item.product_id);
      let product: any = null;

      if (isUuid) {
        const { data } = await dbClient
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .eq("is_published", true)
          .maybeSingle();
        product = data;
      } else {
        const { data } = await dbClient
          .from("products")
          .select("*")
          .or(`sku.eq.${item.product_id},slug.eq.${item.product_id}`)
          .eq("is_published", true)
          .maybeSingle();
        product = data;
      }

      if (!product && (item.product_id.startsWith("mock-") || !isUuid)) {
        const unitPrice = 1500;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        validatedItems.push({
          product_id: null,
          variation_id: null,
          variation_attributes: {},
          variation_title: "Bakery Item",
          product_name: `Product (${item.product_id})`,
          sku: item.product_id,
          image_path: "/placeholder-bake.svg",
          unit_price: unitPrice,
          quantity: item.quantity,
          line_total: lineTotal,
          is_variable: false,
        });
        continue;
      }

      if (!product) {
        return NextResponse.json(
          { error: "One or more items in your cart are no longer available." },
          { status: 400 }
        );
      }

      let regularPrice = Number(product.price);
      let unitPrice = Number(product.sale_price ?? product.price);
      let varTitle = product.name;
      let attributes: any = {};
      let sku = product.sku;
      let imagePath = product.featured_image;
      let validVariationId: string | null = null;

      if (product.product_type === "variable") {
        if (!item.variation_id) {
          return NextResponse.json(
            { error: `Please select all options for ${product.name}` },
            { status: 400 }
          );
        }

        const isVarUuid = UUID_REGEX.test(item.variation_id);
        const varQuery = dbClient
          .from("product_variations")
          .select("*")
          .eq("product_id", product.id)
          .eq("status", "active");

        const { data: variation } = isVarUuid
          ? await varQuery.eq("id", item.variation_id).maybeSingle()
          : await varQuery.eq("sku", item.variation_id).maybeSingle();

        if (variation) {
          if ((variation.stock_quantity ?? 0) < item.quantity) {
            return NextResponse.json(
              { error: `Selected options for ${product.name} are out of stock.` },
              { status: 400 }
            );
          }
          regularPrice = Number(variation.regular_price ?? variation.price);
          unitPrice = Number(variation.sale_price ?? variation.regular_price);
          varTitle = variation.title || variation.name || product.name;
          attributes = variation.attributes ?? {};
          sku = variation.sku ?? product.sku;
          imagePath = variation.image_url || product.featured_image;
          validVariationId = variation.id;
        }
      } else {
        if ((product.stock_quantity ?? 0) < item.quantity) {
          return NextResponse.json(
            { error: `${product.name} is currently out of stock.` },
            { status: 400 }
          );
        }
      }

      // Check active deal pricing
      const dealCalc = calculateProductDealPrice({
        productId: product.id,
        variationId: validVariationId,
        regularPrice,
        activeDeals,
      });

      if (dealCalc.isOnDeal) {
        unitPrice = dealCalc.dealPrice;
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        product_id: product.id,
        variation_id: validVariationId,
        variation_attributes: attributes ?? {},
        variation_title: varTitle !== product.name ? varTitle : undefined,
        product_name: product.name,
        sku: sku,
        image_path: imagePath || "/placeholder-bake.svg",
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
        is_variable: product.product_type === "variable",
        deal_id: dealCalc.dealId || null,
        deal_name: dealCalc.dealName || null,
        regular_price: regularPrice,
        discount_amount: dealCalc.discountAmount,
      });
    }

    // Calculate delivery fee (free shipping if subtotal >= 3000 PKR)
    const deliveryFee = subtotal >= 3000 ? 0 : 250;
    const orderNumber = "BM-" + Math.floor(10000 + Math.random() * 90000);
    const totalAmount = subtotal + deliveryFee;

    // 1. Create order record
    const { data: order, error: orderErr } = await dbClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        customer_name: parsed.data.customer.full_name,
        customer_phone: parsed.data.customer.phone.replace(/\s+/g, ""),
        customer_email: parsed.data.customer.email || null,
        city: parsed.data.customer.city,
        area: parsed.data.customer.area,
        delivery_address: parsed.data.customer.address,
        landmark: parsed.data.customer.landmark || null,
        delivery_instructions: parsed.data.customer.instructions || null,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: totalAmount,
        payment_method: parsed.data.payment_method,
        status: "placed",
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      console.error("Order insertion error:", orderErr);
      return NextResponse.json({ error: orderErr?.message ?? "Failed to save order." }, { status: 400 });
    }

    // 2. Create order items in batch & adjust stock
    const itemsToInsert = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variation_id: item.variation_id,
      variation_attributes: item.variation_attributes ?? {},
      variation_title: item.variation_title,
      image_path: item.image_path,
      product_name: item.product_name,
      sku: item.sku,
      unit_price: item.unit_price,
      quantity: item.quantity,
      line_total: item.line_total,
      deal_id: item.deal_id,
      deal_name: item.deal_name,
      regular_price: item.regular_price,
      discount_amount: item.discount_amount,
    }));

    const { error: itemsInsertErr } = await dbClient.from("order_items").insert(itemsToInsert);
    if (itemsInsertErr) {
      console.error("Order items batch insertion error:", itemsInsertErr);
      return NextResponse.json({ error: itemsInsertErr.message || "Failed to save order items." }, { status: 400 });
    }

    for (const item of validatedItems) {
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

    // 5. Auto-save delivery address to user's profile if logged in
    if (user?.id) {
      await autoSaveCustomerAddress(dbClient, user.id, parsed.data.customer);
    }

    return NextResponse.json({ ok: true, order_number: order.order_number });
  } catch (err: any) {
    console.error("Order submission unexpected failure:", err);
    return NextResponse.json(
      { error: err?.message || "Order submission failed. Please try again." },
      { status: 500 }
    );
  }
}
