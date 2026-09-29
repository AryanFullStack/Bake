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

const sql = `
-- Fix product_attribute_images RLS policy: do not invoke private.is_admin() for anon
drop policy if exists "public product attribute images" on public.product_attribute_images;
drop policy if exists "anon product attribute images" on public.product_attribute_images;
drop policy if exists "auth product attribute images" on public.product_attribute_images;

create policy "anon product attribute images" on public.product_attribute_images
  for select to anon
  using (exists (
    select 1 from public.product_attribute_values v
    join public.product_attributes a on a.id = v.attribute_id
    join public.products p on p.id = a.product_id
    where v.id = attribute_value_id and p.is_published = true
  ));

create policy "auth product attribute images" on public.product_attribute_images
  for select to authenticated
  using (exists (
    select 1 from public.product_attribute_values v
    join public.product_attributes a on a.id = v.attribute_id
    join public.products p on p.id = a.product_id
    where v.id = attribute_value_id and (p.is_published = true or (select private.is_admin()))
  ));

grant select on public.product_attribute_images to anon, authenticated;
`;

const res = await pgQuery(sql);
console.log("Status:", res.status);
console.log("Body:", res.body);
