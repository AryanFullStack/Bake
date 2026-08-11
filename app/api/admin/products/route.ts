import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mediaService } from "@/lib/media/media-service";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

async function getAdminDatabaseClient() {
  return createSupabaseAdminClient() || (await createSupabaseServerClient());
}

async function syncProductAttributes(supabase: any, productId: string, attributes: any[]) {
  await supabase.from("product_attributes").delete().eq("product_id", productId);
  if (!Array.isArray(attributes)) return;
  for (const [attributeIndex, attribute] of attributes.entries()) {
    const { data: savedAttribute, error } = await supabase.from("product_attributes").insert({
      product_id: productId,
      name: attribute.name,
      slug: attribute.slug || slugify(attribute.name),
      display_type: attribute.displayType || attribute.display_type || "button",
      sort_order: attribute.sortOrder ?? attributeIndex,
      is_required: attribute.required !== false,
      controls_images: attribute.controlsImages ?? attribute.controls_images ?? (attribute.displayType === "color" || attribute.display_type === "color" || attribute.name?.toLowerCase().includes("color")),
    }).select("id").single();
    if (error || !savedAttribute) throw error ?? new Error("Unable to save product attribute");
    const values = Array.isArray(attribute.values) ? attribute.values : [];
    if (values.length) {
      for (const [valueIndex, value] of values.entries()) {
        const { data: savedValue, error: valErr } = await supabase.from("product_attribute_values").insert({
          attribute_id: savedAttribute.id,
          label: value.label,
          slug: value.slug || slugify(value.label),
          sort_order: value.sortOrder ?? valueIndex,
          swatch_color: value.swatchColor || value.swatch_color || null,
          swatch_image: value.swatchImage || value.swatch_image || null,
          is_active: value.isActive !== false && value.is_active !== false,
        }).select("id").single();

        if (valErr || !savedValue) throw valErr ?? new Error("Unable to save attribute value");

        const attrImages = Array.isArray(value.images) ? value.images : (Array.isArray(value.gallery_images) ? value.gallery_images : []);
        if (attrImages.length > 0) {
          const imagesToInsert = attrImages.filter(Boolean).map((imgPath: string, imgIdx: number) => ({
            attribute_value_id: savedValue.id,
            storage_path: imgPath,
            sort_order: imgIdx,
          }));
          if (imagesToInsert.length > 0) {
            const { error: imgErr } = await supabase.from("product_attribute_images").insert(imagesToInsert);
            if (imgErr) console.error("[syncProductAttributes] Error saving attribute images:", imgErr.message);
          }
        }
      }
    }
  }
}

async function syncVariationMedia(supabase: any, variationId: string, variation: any, fallbackAlt: string) {
  const gallery = Array.isArray(variation.gallery_images) ? variation.gallery_images.filter(Boolean) : [];
  const featured = variation.featured_image || variation.image_url || gallery[0] || null;
  await supabase.from("product_variation_images").delete().eq("variation_id", variationId);
  const paths = Array.from(new Set([featured, ...gallery].filter(Boolean)));
  if (paths.length) {
    const { error } = await supabase.from("product_variation_images").insert(paths.map((path: string, index: number) => ({
      variation_id: variationId,
      storage_path: path,
      alt_text: variation.name || fallbackAlt,
      sort_order: index,
      is_featured: index === 0,
    })));
    if (error) throw error;
  }
}

async function syncProductVariations(supabase: any, productId: string, product: any, variations: any[]) {
  const { data: existing, error: existingError } = await supabase.from("product_variations").select("id,combination_key").eq("product_id", productId);
  if (existingError) throw existingError;
  const incomingKeys = new Set<string>();
  for (const variation of variations) {
    const combinationKey = variation.combination_key || variation.combinationKey || Object.entries(variation.attributes || {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("|");
    incomingKeys.add(combinationKey);
    const payload = {
      product_id: productId,
      combination_key: combinationKey,
      name: variation.name || `${product.name} - ${Object.values(variation.attributes || {}).join(" / ")}`,
      title: variation.title || null,
      description: variation.description || null,
      sku: variation.sku || `${product.sku}-${slugify(Object.values(variation.attributes || {}).join("-"))}`,
      barcode: variation.barcode || null,
      regular_price: Number(variation.regular_price ?? variation.regularPrice ?? product.price) || 0,
      sale_price: variation.sale_price == null && variation.salePrice == null ? null : Number(variation.sale_price ?? variation.salePrice),
      cost_price: variation.cost_price == null && variation.costPrice == null ? null : Number(variation.cost_price ?? variation.costPrice),
      stock_quantity: Number(variation.stock_quantity ?? variation.stockQuantity) || 0,
      low_stock_threshold: Number(variation.low_stock_threshold ?? variation.lowStockThreshold) || 5,
      attributes: variation.attributes || {},
      specifications: variation.specifications || {},
      weight: variation.weight == null ? null : Number(variation.weight),
      dimensions: variation.dimensions || {},
      image_url: variation.featured_image || variation.featuredImage || variation.image_url || null,
      status: variation.status || "active",
      updated_at: new Date().toISOString(),
    };
    const match = (existing ?? []).find((row: any) => row.combination_key === combinationKey);
    let variationId = match?.id;
    if (variationId) {
      const { error } = await supabase.from("product_variations").update(payload).eq("id", variationId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("product_variations").insert(payload).select("id").single();
      if (error || !data) throw error ?? new Error("Unable to save variation");
      variationId = data.id;
    }
    await syncVariationMedia(supabase, variationId, variation, product.name);
  }
  const removed = (existing ?? []).filter((row: any) => !incomingKeys.has(row.combination_key)).map((row: any) => row.id);
  if (removed.length) await supabase.from("product_variations").update({ status: "inactive", updated_at: new Date().toISOString() }).in("id", removed);
  const { data: totals } = await supabase.from("product_variations").select("stock_quantity").eq("product_id", productId).eq("status", "active");
  await supabase.from("products").update({ stock_quantity: (totals ?? []).reduce((sum: number, row: any) => sum + Number(row.stock_quantity || 0), 0) }).eq("id", productId);
}

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id") || "";
    const stockStatus = searchParams.get("stock_status") || "";
    const status = searchParams.get("status") || "";
    const productType = searchParams.get("product_type") || "";

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("products")
      .select(
        "id, name, slug, sku, barcode, product_type, description, short_description, specifications, ingredients, care_instructions, delivery_information, return_policy, price, sale_price, stock_quantity, low_stock_threshold, is_published, is_featured, is_bestseller, category_id, brand_id, tags, seo_title, seo_description, created_at, updated_at, categories:category_id(id, name, slug), brands:brand_id(id, name, slug), product_images(id, storage_path, sort_order, alt_text), product_attributes(id,name,slug,display_type,sort_order,is_required,controls_images,product_attribute_values(id,label,slug,sort_order,swatch_color,swatch_image,is_active,product_attribute_images(id,storage_path,sort_order,product_image_id))), product_variations(id,combination_key,name,title,description,sku,barcode,regular_price,sale_price,stock_quantity,low_stock_threshold,status,attributes,weight,dimensions,specifications,product_variation_images(storage_path,sort_order,is_featured))",
        { count: "exact" }
      );

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.or(`category_id.eq.${categoryId},subcategory_id.eq.${categoryId}`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (productType) {
      query = query.eq("product_type", productType);
    }

    if (stockStatus === "out_of_stock") {
      query = query.eq("stock_quantity", 0);
    } else if (stockStatus === "low_stock") {
      query = query.gt("stock_quantity", 0).lte("stock_quantity", 5);
    } else if (stockStatus === "in_stock") {
      query = query.gt("stock_quantity", 0);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: products, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[API admin/products GET] Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      products: products || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("[API admin/products GET] Server error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      sku,
      barcode,
      product_type = "simple",
      brand_id,
      category_id,
      subcategory_id,
      description,
      price,
      sale_price,
      cost_price,
      stock_quantity = 0,
      low_stock_threshold = 5,
      warehouse_location,
      track_inventory = true,
      tags = [],
      search_keywords = [],
      featured_image,
      gallery_images = [],
      variations = [],
      seo_title,
      seo_description,
      status = "published",
      is_featured = false,
      is_bestseller = false,
      short_description,
      specifications = {},
      ingredients,
      care_instructions,
      delivery_information,
      return_policy,
      attributes = [],
    } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: "Product name and SKU are required." }, { status: 400 });
    }

    const supabase = await getAdminDatabaseClient();
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    // Insert Product
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .insert({
        name,
        slug: cleanSlug,
        sku,
        barcode,
        product_type,
        brand_id: brand_id || null,
        category_id: category_id || null,
        subcategory_id: subcategory_id || null,
        description,
        price: Number(price) || 0,
        sale_price: sale_price ? Number(sale_price) : null,
        cost_price: cost_price ? Number(cost_price) : null,
        stock_quantity: Number(stock_quantity) || 0,
        low_stock_threshold: Number(low_stock_threshold) || 5,
        warehouse_location,
        track_inventory,
        tags: Array.isArray(tags) ? tags : [],
        search_keywords: Array.isArray(search_keywords) ? search_keywords : [],
        featured_image,
        seo_title,
        seo_description,
        status,
        is_published: status === "published",
        is_featured,
        is_bestseller,
        short_description,
        specifications,
        ingredients,
        care_instructions,
        delivery_information,
        return_policy,
      })
      .select("id")
      .single();

    if (prodErr) {
      console.error("[API admin/products POST] Insert product error:", prodErr);
      return NextResponse.json({ error: prodErr.message }, { status: 400 });
    }

    const productId = product.id;

    // Insert Gallery Images
    if (Array.isArray(gallery_images) && gallery_images.length > 0) {
      const imagesToInsert = gallery_images.map((imgUrl: string, idx: number) => ({
        product_id: productId,
        storage_path: imgUrl,
        sort_order: idx,
        alt_text: name,
      }));
      await supabase.from("product_images").insert(imagesToInsert);
    }

    // Insert Variations for Variable Products
    if (product_type === "variable" && Array.isArray(variations)) await syncProductVariations(supabase, productId, { name, sku, price }, variations);
    if (product_type === "variable" && Array.isArray(attributes)) await syncProductAttributes(supabase, productId, attributes);

    return NextResponse.json({
      success: true,
      message: "Product created successfully.",
      product_id: productId,
    });
  } catch (error: any) {
    console.error("[API admin/products POST] Server error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { id, gallery_images, variations, attributes, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const supabase = await getAdminDatabaseClient();

    if (updates.status) {
      updates.is_published = updates.status === "published";
    }

    // Update main product record
    const { error: updateErr } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Sync Gallery Images if provided
    if (Array.isArray(gallery_images)) {
      await supabase.from("product_images").delete().eq("product_id", id);
      if (gallery_images.length > 0) {
        const imagesToInsert = gallery_images.map((imgUrl: string, idx: number) => ({
          product_id: id,
          storage_path: imgUrl,
          sort_order: idx,
        }));
        await supabase.from("product_images").insert(imagesToInsert);
      }
    }

    // Sync Variations if provided
    if (Array.isArray(variations)) await syncProductVariations(supabase, id, { name: updates.name, sku: updates.sku, price: updates.price }, variations);
    if (Array.isArray(attributes)) await syncProductAttributes(supabase, id, attributes);

    return NextResponse.json({ success: true, message: "Product updated successfully." });
  } catch (error: any) {
    console.error("[API admin/products PATCH] Server error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let productId = searchParams.get("id");

    if (!productId) {
      const body = await req.json().catch(() => ({}));
      productId = body.id;
    }

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const supabase = await getAdminDatabaseClient();

    // 1. Fetch images associated with this product for disk cleanup
    const { data: product } = await supabase
      .from("products")
      .select("featured_image, product_images(storage_path)")
      .eq("id", productId)
      .single();

    if (product) {
      // Clean up featured image from disk
      if (product.featured_image) {
        await mediaService.deleteImage(product.featured_image);
      }
      // Clean up gallery images from disk
      if (Array.isArray(product.product_images)) {
        for (const img of product.product_images) {
          if (img.storage_path) {
            await mediaService.deleteImage(img.storage_path);
          }
        }
      }
    }

    // 2. Delete product record (DB cascade deletes product_images and product_variations)
    const { error: delErr } = await supabase.from("products").delete().eq("id", productId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Product and associated persistent images purged successfully.",
    });
  } catch (error: any) {
    console.error("[API admin/products DELETE] Server error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
