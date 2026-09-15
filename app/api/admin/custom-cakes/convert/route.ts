import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseCakeSpecifications, parseQuotationBreakdown } from "@/lib/custom-cake";
import { resolveCakeImageUrl } from "@/lib/custom-cake-media";

export async function POST(request: Request) {
  try {
    const admin = await assertAdminApi();
    if (!admin) return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

    const body = await request.json();
    const { request_id } = body;
    if (!request_id) {
      return NextResponse.json({ error: "Custom cake request ID is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    // 1. Fetch Request with all quotes and images
    const { data: reqData, error: reqErr } = await dbClient
      .from("custom_cake_requests")
      .select("*, custom_cake_quotes(*), custom_cake_images(*)")
      .eq("id", request_id)
      .single();

    if (reqErr || !reqData) {
      return NextResponse.json({ error: "Custom cake request not found" }, { status: 404 });
    }

    // 2. Prevent accidental duplicate conversion
    if (reqData.linked_order_id) {
      const { data: existingOrder } = await dbClient
        .from("orders")
        .select("id, order_number")
        .eq("id", reqData.linked_order_id)
        .single();

      if (existingOrder) {
        return NextResponse.json(
          {
            error: `This custom cake request has already been converted to Storefront Order #${existingOrder.order_number}`,
            order_number: existingOrder.order_number,
            order_id: existingOrder.id,
          },
          { status: 409 }
        );
      }
    }

    const quoteRow = Array.isArray(reqData.custom_cake_quotes)
      ? reqData.custom_cake_quotes[0]
      : reqData.custom_cake_quotes;

    if (!quoteRow) {
      return NextResponse.json(
        { error: "Please prepare a formal quotation before converting to a store order." },
        { status: 400 }
      );
    }

    const quote = parseQuotationBreakdown(quoteRow, reqData);
    if (!quote) {
      return NextResponse.json(
        { error: "Could not parse quotation breakdown. Please ensure quotation details are saved." },
        { status: 400 }
      );
    }
    const specs = parseCakeSpecifications(reqData);

    // Pick first reference image URL (from ImageKit)
    let refImageUrl = "/placeholder-bake.svg";
    if (reqData.custom_cake_images && reqData.custom_cake_images.length > 0) {
      refImageUrl = resolveCakeImageUrl(reqData.custom_cake_images[0].storage_path);
    }

    // Generate formatted order number
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `BM-${randomSeq}`;

    const subtotal = Math.max(
      0,
      quote.base_price +
        quote.design_charges +
        quote.tier_charges +
        quote.extra_charges -
        quote.discount
    );

    // 3. Create Storefront Order
    const { data: newOrder, error: orderErr } = await dbClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: reqData.user_id || null,
        customer_name: reqData.customer_name,
        customer_phone: reqData.phone,
        customer_email: reqData.email || null,
        city: reqData.city,
        area: reqData.area,
        delivery_address: reqData.delivery_address,
        landmark: reqData.landmark || null,
        delivery_instructions: reqData.delivery_instructions || null,
        preferred_delivery_at: reqData.preferred_delivery_at || null,
        subtotal: subtotal || quote.final_price,
        delivery_fee: quote.delivery_fee || 0,
        discount: quote.discount || 0,
        total: quote.final_price,
        payment_method: reqData.payment_method || "bank_transfer",
        status: "confirmed",
      })
      .select("id, order_number")
      .single();

    if (orderErr || !newOrder) {
      return NextResponse.json(
        { error: orderErr?.message || "Failed to create order from custom cake brief" },
        { status: 500 }
      );
    }

    // 4. Create Order Item with ImageKit reference image attached
    await dbClient.from("order_items").insert({
      order_id: newOrder.id,
      product_name: `Custom Cake: ${specs.cake_type}`,
      variation_title: `${specs.flavor} (${specs.cake_size})`,
      variation_attributes: {
        cake_type: specs.cake_type,
        cake_size: specs.cake_size,
        flavor: specs.flavor,
        filling: specs.filling,
        shape: specs.shape,
        tiers: specs.tiers,
        dietary: specs.dietary_requirements,
        theme: specs.theme,
        cake_message: specs.cake_message,
      },
      image_path: refImageUrl,
      unit_price: quote.final_price,
      quantity: 1,
      line_total: quote.final_price,
    });

    // 5. Update Custom Cake Request with linked_order_id and status
    await dbClient
      .from("custom_cake_requests")
      .update({
        linked_order_id: newOrder.id,
        status: "confirmed",
      })
      .eq("id", request_id);

    // 6. Record Status History for Custom Cake
    await dbClient.from("custom_cake_status_history").insert({
      request_id,
      old_status: reqData.status,
      new_status: "confirmed",
      note: `Converted to storefront order #${orderNumber} by staff.`,
      changed_by: admin.user.id,
    });

    // 7. Record Status History for new Order
    await dbClient.from("order_status_history").insert({
      order_id: newOrder.id,
      old_status: "placed",
      new_status: "confirmed",
      note: `Generated from custom cake request #${reqData.request_number}`,
      changed_by: admin.user.id,
    });

    return NextResponse.json({
      success: true,
      order_id: newOrder.id,
      order_number: orderNumber,
      message: `Successfully converted to Order #${orderNumber}`,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/custom-cakes/convert error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to convert custom cake request to order" },
      { status: 500 }
    );
  }
}
