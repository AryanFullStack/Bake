import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log("=== SUPABASE DATABASE AUDIT ===");

  // 1. Products
  const { data: products, error: pErr } = await supabase.from("products").select("id, name, slug, featured_image");
  if (pErr) console.error("Error fetching products:", pErr);
  else {
    console.log(`Total Products: ${products.length}`);
    let ikCount = 0;
    let vpsCount = 0;
    let nullCount = 0;
    let externalCount = 0;
    let placeholderCount = 0;

    for (const p of products) {
      const img = p.featured_image;
      if (!img) nullCount++;
      else if (img.includes("placeholder")) placeholderCount++;
      else if (img.includes("imagekit.io")) ikCount++;
      else if (img.startsWith("http")) externalCount++;
      else vpsCount++;
    }

    console.log(`Products image breakdown:
    - ImageKit CDN: ${ikCount}
    - VPS / Relative paths: ${vpsCount}
    - External URLs: ${externalCount}
    - Placeholder: ${placeholderCount}
    - Null / Empty: ${nullCount}`);

    console.log("\nSample product image URLs:");
    products.slice(0, 15).forEach(p => {
      console.log(`  [${p.id}] ${p.name.substring(0, 30)} -> ${p.featured_image}`);
    });
  }

  // 2. Product Images (Gallery)
  const { data: pImages } = await supabase.from("product_images").select("id, product_id, storage_path");
  console.log(`\nTotal Product Gallery Images: ${pImages?.length || 0}`);
  if (pImages) {
    let ikCount = 0, vpsCount = 0, externalCount = 0;
    pImages.forEach(pi => {
      const img = pi.storage_path;
      if (img?.includes("imagekit.io")) ikCount++;
      else if (img?.startsWith("http")) externalCount++;
      else vpsCount++;
    });
    console.log(`  - ImageKit: ${ikCount}, VPS/Rel: ${vpsCount}, External: ${externalCount}`);
  }

  // 3. Product Variations
  const { data: pVars } = await supabase.from("product_variations").select("id, product_id, image_url");
  console.log(`\nTotal Product Variations: ${pVars?.length || 0}`);
  if (pVars) {
    let withImg = 0, ikCount = 0, vpsCount = 0;
    pVars.forEach(v => {
      if (v.image_url) {
        withImg++;
        if (v.image_url.includes("imagekit.io")) ikCount++;
        else vpsCount++;
      }
    });
    console.log(`  - With Image: ${withImg} (ImageKit: ${ikCount}, VPS/Rel: ${vpsCount})`);
  }

  // 4. Categories
  const { data: categories } = await supabase.from("categories").select("id, name, image_path");
  console.log(`\nTotal Categories: ${categories?.length || 0}`);
  categories?.forEach(c => console.log(`  [${c.name}] -> ${c.image_path}`));

  // 5. Banners
  const { data: banners } = await supabase.from("banners").select("id, title, image_path");
  console.log(`\nTotal Banners: ${banners?.length || 0}`);
  banners?.forEach(b => console.log(`  [${b.title}] -> ${b.image_path}`));

  // 6. Media table
  const { data: mediaRows } = await supabase.from("media").select("id, name, storage_path, public_url");
  console.log(`\nTotal Media Rows: ${mediaRows?.length || 0}`);
  console.log("Sample Media rows:");
  mediaRows?.slice(0, 10).forEach(m => console.log(`  [${m.name}] path: ${m.storage_path}, url: ${m.public_url}`));
}

audit().catch(console.error);
