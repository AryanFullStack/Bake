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
  console.error("Missing Supabase credentials in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Resolves local and production uploads directory candidates
const appRoot = process.cwd().includes(".next") ? path.resolve(process.cwd().split(".next")[0]) : process.cwd();
const candidateUploadDirs = Array.from(new Set([
  process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : null,
  path.resolve(appRoot, "..", "uploads"),
  path.resolve(appRoot, "uploads"),
  path.resolve(appRoot, "public", "uploads"),
  path.resolve(process.cwd(), "..", "uploads"),
  path.resolve(process.cwd(), "uploads"),
])).filter(Boolean);

console.log("Uploads candidate directories:", candidateUploadDirs);

// Collect all physical files across candidate uploads directories
function getAllPhysicalFiles(dirs) {
  let results = [];
  const seen = new Set();
  
  function scan(dir, base = "") {
    if (!fs.existsSync(dir)) return;
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const rel = base ? `${base}/${item.name}` : item.name;
      if (item.isDirectory()) {
        scan(path.join(dir, item.name), rel);
      } else {
        if (!seen.has(rel)) {
          seen.add(rel);
          results.push(rel);
        }
      }
    }
  }

  for (const d of dirs) {
    scan(d);
  }
  return results;
}

const physicalFiles = getAllPhysicalFiles(candidateUploadDirs);
console.log(`Found ${physicalFiles.length} physical file(s) across candidate directories.`);

// Helper to normalize any path/URL to /uploads/relative_path format
function normalizeToUploadsUrl(rawPath) {
  if (!rawPath) return null;
  let clean = String(rawPath).trim();
  if (clean.includes("/storage/v1/object/public/")) {
    const parts = clean.split("/storage/v1/object/public/");
    if (parts[1]) {
      const subParts = parts[1].split("/");
      if (["product-images", "categories", "media", "products"].includes(subParts[0])) {
        subParts.shift();
      }
      clean = subParts.join("/");
    }
  }
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    if (clean.includes("unsplash.com")) return clean;
  }
  clean = clean.replace(/^\/api\/media\/serve\//, "");
  clean = clean.replace(/^\/uploads\//, "");
  clean = clean.replace(/^uploads\//, "");
  clean = clean.replace(/^\/+/, "");

  if (!clean) return null;
  return `/uploads/${clean}`;
}

async function syncMedia() {
  console.log("Starting product image database audit and sync...");

  // 1. Audit Products table
  const { data: products, error: pErr } = await supabase.from("products").select("id, name, slug, sku, featured_image");
  if (pErr) console.error("Error fetching products:", pErr);
  else console.log(`Loaded ${products.length} products from DB.`);

  let updatedProductsCount = 0;
  for (const prod of products || []) {
    let currentImage = prod.featured_image;
    let normalized = normalizeToUploadsUrl(currentImage);

    // If normalized is null or placeholder, check if any physical file matches product slug/sku
    if (!normalized || normalized.includes("placeholder")) {
      const match = physicalFiles.find(f => 
        (prod.slug && f.toLowerCase().includes(prod.slug.toLowerCase())) || 
        (prod.sku && f.toLowerCase().includes(prod.sku.toLowerCase()))
      );
      if (match) {
        normalized = `/uploads/${match}`;
        console.log(`Auto-matched product "${prod.name}" (${prod.id}) -> ${normalized}`);
      }
    }

    if (normalized && normalized !== prod.featured_image) {
      const { error: uErr } = await supabase.from("products").update({ featured_image: normalized }).eq("id", prod.id);
      if (!uErr) {
        updatedProductsCount++;
        console.log(`Updated product "${prod.name}" featured_image: ${prod.featured_image} -> ${normalized}`);
      } else {
        console.error(`Failed to update product ${prod.id}:`, uErr.message);
      }
    }
  }

  // 2. Audit product_images table
  const { data: pImages, error: piErr } = await supabase.from("product_images").select("id, product_id, storage_path");
  if (piErr) console.error("Error fetching product_images:", piErr);
  else console.log(`Loaded ${pImages?.length || 0} product_images rows.`);

  let updatedPICount = 0;
  for (const img of pImages || []) {
    const normalized = normalizeToUploadsUrl(img.storage_path);
    if (normalized && normalized !== img.storage_path) {
      const { error: uErr } = await supabase.from("product_images").update({ storage_path: normalized }).eq("id", img.id);
      if (!uErr) updatedPICount++;
    }
  }

  // 3. Audit product_variations table
  const { data: pVars, error: pvErr } = await supabase.from("product_variations").select("id, image_url");
  if (pvErr) console.error("Error fetching product_variations:", pvErr);
  else console.log(`Loaded ${pVars?.length || 0} product_variations rows.`);

  let updatedPVCount = 0;
  for (const v of pVars || []) {
    if (!v.image_url) continue;
    const normalized = normalizeToUploadsUrl(v.image_url);
    if (normalized && normalized !== v.image_url) {
      const { error: uErr } = await supabase.from("product_variations").update({ image_url: normalized }).eq("id", v.id);
      if (!uErr) updatedPVCount++;
    }
  }

  // 4. Audit product_attribute_images table
  const { data: pAttrImgs, error: paiErr } = await supabase.from("product_attribute_images").select("id, storage_path");
  if (!paiErr && pAttrImgs) {
    for (const ai of pAttrImgs) {
      const normalized = normalizeToUploadsUrl(ai.storage_path);
      if (normalized && normalized !== ai.storage_path) {
        await supabase.from("product_attribute_images").update({ storage_path: normalized }).eq("id", ai.id);
      }
    }
  }

  // 5. Audit media table
  const { data: mediaRows, error: mErr } = await supabase.from("media").select("id, storage_path, public_url");
  let updatedMediaCount = 0;
  if (!mErr && mediaRows) {
    for (const m of mediaRows) {
      const normalizedPath = m.storage_path ? m.storage_path.replace(/^\/uploads\//, "").replace(/^\/api\/media\/serve\//, "").replace(/^uploads\//, "") : "";
      const normalizedUrl = normalizeToUploadsUrl(m.public_url || m.storage_path);
      if (normalizedUrl && (m.public_url !== normalizedUrl || m.storage_path !== normalizedPath)) {
        await supabase.from("media").update({ public_url: normalizedUrl, storage_path: normalizedPath || m.storage_path }).eq("id", m.id);
        updatedMediaCount++;
      }
    }
  }

  console.log("=== Sync Complete ===");
  console.log(`Updated Products: ${updatedProductsCount}`);
  console.log(`Updated Product Images: ${updatedPICount}`);
  console.log(`Updated Product Variations: ${updatedPVCount}`);
  console.log(`Updated Media Rows: ${updatedMediaCount}`);
}

syncMedia().catch(console.error);
