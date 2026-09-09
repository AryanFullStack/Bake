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
const supabase = createClient(supabaseUrl, supabaseKey);

const candidateUploadDirs = [
  process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : null,
  path.resolve(process.cwd(), "..", "uploads"),
  path.resolve(process.cwd(), "uploads"),
  path.resolve(process.cwd(), "public", "uploads"),
  path.resolve(process.cwd(), "public"),
  path.resolve(process.cwd(), "public", "products"),
].filter(Boolean);

console.log("Candidate Upload Dirs:", candidateUploadDirs);

candidateUploadDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Directory EXISTS: ${dir}`);
    try {
      const files = fs.readdirSync(dir, { recursive: true });
      console.log(`  File count in ${dir}: ${files.length}`);
      console.log(`  Sample files:`, files.slice(0, 10));
    } catch (err) {
      console.error(`  Error reading ${dir}:`, err.message);
    }
  } else {
    console.log(`Directory DOES NOT EXIST: ${dir}`);
  }
});

async function checkProducts() {
  const { data: products } = await supabase.from("products").select("id, name, featured_image");
  console.log("\n--- Checking Product Files ---");

  for (const p of products) {
    if (!p.featured_image || p.featured_image.includes("imagekit.io")) {
      console.log(`[OK / ImageKit] ${p.name} -> ${p.featured_image}`);
      continue;
    }

    let clean = p.featured_image.trim().split("?")[0];
    clean = clean.replace(/^\/api\/media\/serve\//, "").replace(/^\/uploads\//, "").replace(/^uploads\//, "").replace(/^\/+/, "");

    let foundPath = null;
    for (const base of candidateUploadDirs) {
      if (!fs.existsSync(base)) continue;
      const direct = path.resolve(base, clean);
      if (fs.existsSync(direct) && fs.statSync(direct).isFile()) {
        foundPath = direct;
        break;
      }
      const fname = path.basename(clean);
      const sub = path.resolve(base, "products", fname);
      if (fs.existsSync(sub) && fs.statSync(sub).isFile()) {
        foundPath = sub;
        break;
      }
    }

    if (foundPath) {
      console.log(`[FOUND ON DISK] ${p.name} -> ${foundPath}`);
    } else {
      console.log(`[MISSING ON DISK] ${p.name} -> DB Path: ${p.featured_image} (clean: ${clean})`);
    }
  }
}

checkProducts().catch(console.error);
