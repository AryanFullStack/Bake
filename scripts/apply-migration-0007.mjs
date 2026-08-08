import { readFileSync, existsSync } from "fs";
import https from "https";

// Load .env or .env.local
const envFile = existsSync(".env.local") ? ".env.local" : ".env";
if (existsSync(envFile)) {
  readFileSync(envFile, "utf8")
    .split("\n")
    .forEach((line) => {
      const eq = line.indexOf("=");
      if (eq > 0) {
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim();
        if (k && !process.env[k]) process.env[k] = v;
      }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function pgQuery(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql });
    const hostname = new URL(SUPABASE_URL).hostname;
    const options = {
      hostname,
      path: "/pg/query",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: "Bearer " + SERVICE_KEY,
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

const migrationFile = "supabase/migrations/0007_product_catalog_enhancements.sql";
console.log(`Applying migration ${migrationFile} to ${SUPABASE_URL}...`);
const sql = readFileSync(migrationFile, "utf8");

const result = await pgQuery(sql);
console.log("Response Status:", result.status);
console.log("Response Body:", result.body);
