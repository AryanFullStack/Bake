import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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
const supabase = createClient(supabaseUrl, supabaseKey);

async function detail() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, sku, featured_image, category_id");

  if (error) {
    console.error("Products fetch error:", error);
    return;
  }

  console.log(`=== PRODUCTS (${products.length}) ===`);
  for (const p of products) {
    const { data: images } = await supabase.from("product_images").select("id, storage_path").eq("product_id", p.id);
    console.log(`\n- [${p.id}] ${p.name}`);
    console.log(`  Slug: ${p.slug} | SKU: ${p.sku}`);
    console.log(`  Featured Image: ${p.featured_image}`);
    console.log(`  Gallery (${images?.length || 0}):`, images?.map(i => i.storage_path));
  }
}

detail().catch(console.error);
