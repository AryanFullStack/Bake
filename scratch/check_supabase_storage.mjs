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

async function checkBuckets() {
  console.log("=== SUPABASE STORAGE BUCKETS ===");
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }
  console.log(`Found ${buckets.length} bucket(s):`, buckets.map(b => b.name));

  for (const b of buckets) {
    const { data: files, error: fErr } = await supabase.storage.from(b.name).list("", { limit: 100 });
    if (fErr) {
      console.error(`Error listing bucket ${b.name}:`, fErr);
    } else {
      console.log(`Bucket [${b.name}] files (${files.length}):`);
      files.forEach(f => console.log(`  - ${f.name} (${f.metadata?.size || 0} bytes)`));
    }
  }
}

checkBuckets().catch(console.error);
