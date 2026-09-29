import https from "https";
import { readFileSync } from "fs";

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

async function run() {
  const sql = `
    -- Grant execute on private.is_admin() if needed or split review policies
    DO $$
    BEGIN
      EXECUTE 'GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END $$;

    DROP POLICY IF EXISTS "approved reviews public" ON public.reviews;
    DROP POLICY IF EXISTS "anon approved reviews" ON public.reviews;
    DROP POLICY IF EXISTS "auth approved reviews" ON public.reviews;

    CREATE POLICY "anon approved reviews"
      ON public.reviews FOR SELECT TO anon
      USING (status = 'approved' OR is_approved = true);

    CREATE POLICY "auth approved reviews"
      ON public.reviews FOR SELECT TO authenticated
      USING (
        status = 'approved' 
        OR is_approved = true 
        OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
      );
  `;
  const res = await pgQuery(sql);
  console.log("Result status:", res.status);
  console.log("Result body:", res.body);
}

run();
