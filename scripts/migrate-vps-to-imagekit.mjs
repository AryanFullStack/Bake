import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import ImageKit from "imagekit";
import sharp from "sharp";

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
const ikPublicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const ikPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const ikUrlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment.");
  process.exit(1);
}

if (!ikPublicKey || !ikPrivateKey || !ikUrlEndpoint) {
  console.error("❌ Missing ImageKit credentials in environment (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const imagekit = new ImageKit({
  publicKey: ikPublicKey,
  privateKey: ikPrivateKey,
  urlEndpoint: ikUrlEndpoint,
});

const appRoot = process.cwd().includes(".next") ? path.resolve(process.cwd().split(".next")[0]) : process.cwd();
const candidateUploadDirs = Array.from(new Set([
  process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : null,
  path.resolve(appRoot, "..", "uploads"),
  path.resolve(appRoot, "uploads"),
  path.resolve(appRoot, "public", "uploads"),
  path.resolve(process.cwd(), "..", "uploads"),
  path.resolve(process.cwd(), "uploads"),
])).filter(Boolean);

function findLocalFile(relPath) {
  if (!relPath || relPath.startsWith("http://") || relPath.startsWith("https://")) return null;
  let clean = String(relPath).trim().split("?")[0];
  clean = clean.replace(/^\/api\/media\/serve\//, "").replace(/^\/uploads\//, "").replace(/^uploads\//, "").replace(/^\/+/, "");

  for (const base of candidateUploadDirs) {
    if (!fs.existsSync(base)) continue;
    const full = path.resolve(base, clean);
    if (fs.existsSync(full)) return full;

    // Fallback search by filename inside subfolders
    const fname = path.basename(clean);
    const folders = ["products", "categories", "brands", "banners", "custom-cakes"];
    for (const f of folders) {
      const alt = path.resolve(base, f, fname);
      if (fs.existsSync(alt)) return alt;
    }
  }
  return null;
}

async function getBufferForPath(rawPath) {
  // Ignore external URLs (e.g. Unsplash) to save ImageKit storage space
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return null;
  }

  // 1. Check local filesystem
  const localFile = findLocalFile(rawPath);
  if (localFile) {
    try {
      return fs.readFileSync(localFile);
    } catch {
      // Error reading local file
    }
  }

  // 2. Check site URL fallback for VPS relative paths if site is online
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/+$/, "");
  if (siteUrl && (rawPath.startsWith("/") || rawPath.startsWith("uploads/"))) {
    try {
      const fullUrl = rawPath.startsWith("/") ? `${siteUrl}${rawPath}` : `${siteUrl}/${rawPath}`;
      const res = await fetch(fullUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    } catch {
      // Site fetch failed
    }
  }

  return null;
}

async function runMigration() {
  console.log("🚀 Starting VPS to ImageKit Image Migration...");
  console.log(`Target ImageKit Endpoint: ${ikUrlEndpoint}`);

  const uploadedCache = new Map();
  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  async function uploadToImageKit(rawPath, folderHint = "products") {
    if (!rawPath || typeof rawPath !== "string") return null;
    
    // Ignore external URLs (e.g. Unsplash) and already migrated ImageKit URLs
    if (rawPath.includes("imagekit.io") || rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      return null;
    }

    let clean = String(rawPath).trim().split("?")[0];
    clean = clean.replace(/^\/api\/media\/serve\//, "").replace(/^\/uploads\//, "").replace(/^uploads\//, "").replace(/^\/+/, "");

    if (uploadedCache.has(rawPath) || uploadedCache.has(clean)) {
      return uploadedCache.get(rawPath) || uploadedCache.get(clean);
    }

    const buffer = await getBufferForPath(rawPath);
    if (!buffer) {
      console.warn(`⚠️ VPS file not found locally or on server for path: ${rawPath}`);
      skippedCount++;
      return null;
    }

    const folder = clean.includes("/") ? clean.split("/")[0] : folderHint;
    let filename = path.basename(clean.split("?")[0]);
    if (!filename || filename.length < 3 || filename.includes(":")) {
      filename = `vps_${Math.floor(Date.now() / 1000)}.webp`;
    }

    let fileBuffer = buffer;

    // Compress & Optimize to WebP before uploading to ImageKit
    try {
      fileBuffer = await sharp(buffer)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      // Use original buffer if sharp processing fails
    }

    try {
      const targetFilename = filename.endsWith(".webp") ? filename : `${filename.split(".")[0]}.webp`;
      console.log(`📤 Uploading VPS image ${targetFilename} to ImageKit /${folder}...`);
      const res = await imagekit.upload({
        file: fileBuffer,
        fileName: targetFilename,
        folder: `/${folder}`,
        useUniqueFileName: false,
      });

      if (res && res.url) {
        console.log(`✅ Uploaded: ${rawPath} -> ${res.url}`);
        uploadedCache.set(rawPath, res.url);
        uploadedCache.set(clean, res.url);
        migratedCount++;
        return res.url;
      }
    } catch (err) {
      console.error(`❌ ImageKit upload failed for ${rawPath}:`, err?.message || err);
      failedCount++;
    }
    return null;
  }

  // 1. Migrate Products featured_image
  const { data: products } = await supabase.from("products").select("id, name, featured_image");
  if (products) {
    for (const p of products) {
      if (p.featured_image && !p.featured_image.includes("imagekit.io")) {
        const ikUrl = await uploadToImageKit(p.featured_image, "products");
        if (ikUrl) {
          await supabase.from("products").update({ featured_image: ikUrl }).eq("id", p.id);
        }
      }
    }
  }

  // 2. Migrate Product Images gallery
  const { data: pImages } = await supabase.from("product_images").select("id, storage_path");
  if (pImages) {
    for (const pi of pImages) {
      if (pi.storage_path && !pi.storage_path.includes("imagekit.io")) {
        const ikUrl = await uploadToImageKit(pi.storage_path, "products");
        if (ikUrl) {
          await supabase.from("product_images").update({ storage_path: ikUrl }).eq("id", pi.id);
        }
      }
    }
  }

  // 3. Migrate Variations image_url
  const { data: pVars } = await supabase.from("product_variations").select("id, image_url");
  if (pVars) {
    for (const v of pVars) {
      if (v.image_url && !v.image_url.includes("imagekit.io")) {
        const ikUrl = await uploadToImageKit(v.image_url, "products");
        if (ikUrl) {
          await supabase.from("product_variations").update({ image_url: ikUrl }).eq("id", v.id);
        }
      }
    }
  }

  // 4. Migrate Categories image_path
  const { data: categories } = await supabase.from("categories").select("id, name, image_path");
  if (categories) {
    for (const c of categories) {
      if (c.image_path && !c.image_path.includes("imagekit.io")) {
        const ikUrl = await uploadToImageKit(c.image_path, "categories");
        if (ikUrl) {
          await supabase.from("categories").update({ image_path: ikUrl }).eq("id", c.id);
        }
      }
    }
  }

  // 5. Migrate Banners image_path
  const { data: banners } = await supabase.from("banners").select("id, title, image_path");
  if (banners) {
    for (const b of banners) {
      if (b.image_path && !b.image_path.includes("imagekit.io")) {
        const ikUrl = await uploadToImageKit(b.image_path, "banners");
        if (ikUrl) {
          await supabase.from("banners").update({ image_path: ikUrl }).eq("id", b.id);
        }
      }
    }
  }

  // 6. Update media DB table
  for (const [cleanPath, ikUrl] of uploadedCache.entries()) {
    await supabase
      .from("media")
      .update({ public_url: ikUrl, storage_path: ikUrl, updated_at: new Date().toISOString() })
      .or(`storage_path.ilike.%${cleanPath}%,public_url.ilike.%${cleanPath}%`);
  }

  console.log("\n=================================");
  console.log("🎉 VPS to ImageKit Migration Summary:");
  console.log(`✅ Successfully Migrated: ${migratedCount}`);
  console.log(`⚠️ Skipped (File Missing/External URL/Already on IK): ${skippedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log("=================================\n");
}

runMigration().catch(console.error);
