import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getAdminDatabaseClient() {
  return createSupabaseAdminClient() || (await createSupabaseServerClient());
}

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const supabase = await getAdminDatabaseClient();

    // 1. Fetch original product with images, attributes, and variations
    const { data: source, error: fetchErr } = await supabase
      .from("products")
      .select("*, product_images(*), product_attributes(*, product_attribute_values(*, product_attribute_images(*))), product_variations(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !source) {
      return NextResponse.json({ error: "Source product not found." }, { status: 404 });
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newName = `${source.name} (Copy)`;
    const newSlug = `${source.slug}-copy-${randomSuffix.toLowerCase()}`;
    const newSku = `${source.sku}-COPY-${randomSuffix}`;

    // 2. Insert duplicated product
    const { id: origId, created_at, updated_at, product_images, product_attributes, product_variations, ...productData } = source;

    const { data: newProduct, error: insertErr } = await supabase
      .from("products")
      .insert({
        ...productData,
        name: newName,
        slug: newSlug,
        sku: newSku,
        status: "draft",
        is_published: false,
      })
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    const newProductId = newProduct.id;

    // 3. Duplicate product_images
    if (Array.isArray(product_images) && product_images.length > 0) {
      const imagesToInsert = product_images.map((img: any) => ({
        product_id: newProductId,
        storage_path: img.storage_path,
        sort_order: img.sort_order,
        alt_text: img.alt_text,
      }));
      await supabase.from("product_images").insert(imagesToInsert);
    }

    // 4. Duplicate product_attributes and values
    if (Array.isArray(product_attributes) && product_attributes.length > 0) {
      for (const attr of product_attributes) {
        const { data: savedAttr } = await supabase
          .from("product_attributes")
          .insert({
            product_id: newProductId,
            name: attr.name,
            slug: attr.slug,
            display_type: attr.display_type,
            sort_order: attr.sort_order,
            is_required: attr.is_required,
            controls_images: attr.controls_images ?? false,
          })
          .select("id")
          .single();

        if (savedAttr && Array.isArray(attr.product_attribute_values)) {
          for (const v of attr.product_attribute_values) {
            const { data: savedVal } = await supabase
              .from("product_attribute_values")
              .insert({
                attribute_id: savedAttr.id,
                label: v.label,
                slug: v.slug,
                sort_order: v.sort_order,
                swatch_color: v.swatch_color,
                swatch_image: v.swatch_image,
                is_active: v.is_active,
              })
              .select("id")
              .single();

            if (savedVal && Array.isArray(v.product_attribute_images) && v.product_attribute_images.length > 0) {
              const attrImgInserts = v.product_attribute_images.map((img: any) => ({
                attribute_value_id: savedVal.id,
                storage_path: img.storage_path,
                sort_order: img.sort_order,
              }));
              await supabase.from("product_attribute_images").insert(attrImgInserts);
            }
          }
        }
      }
    }

    // 5. Duplicate product_variations
    if (Array.isArray(product_variations) && product_variations.length > 0) {
      const varsToInsert = product_variations.map((v: any) => ({
        product_id: newProductId,
        combination_key: v.combination_key,
        name: `${newName} - ${v.name.split(" - ")[1] || v.name}`,
        sku: v.sku ? `${v.sku}-COPY-${randomSuffix}` : null,
        barcode: v.barcode,
        regular_price: v.regular_price,
        sale_price: v.sale_price,
        cost_price: v.cost_price,
        stock_quantity: v.stock_quantity,
        low_stock_threshold: v.low_stock_threshold,
        image_url: v.image_url,
        attributes: v.attributes,
        status: v.status,
      }));
      await supabase.from("product_variations").insert(varsToInsert);
    }

    return NextResponse.json({
      success: true,
      message: "Product duplicated successfully as draft.",
      new_product_id: newProductId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to duplicate product" }, { status: 500 });
  }
}
