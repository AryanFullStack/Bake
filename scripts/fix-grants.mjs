import { readFileSync } from "fs";
import https from "https";

// Load .env
readFileSync(".env", "utf8")
  .split("\n")
  .forEach((line) => {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k) process.env[k] = v;
    }
  });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function fix() {
  const sql = `
    GRANT ALL ON SCHEMA public TO service_role, postgres, anon, authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres, anon, authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres, anon, authenticated;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role, postgres, anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, postgres, anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role, postgres, anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role, postgres, anon, authenticated;
  `;
  const res = await pgQuery(sql);
  console.log("Grant result status:", res.status);
  console.log("Grant result body:", res.body);
}

fix();
