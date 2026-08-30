import fs from "fs";

const url = "https://dgipjdyzcugtegfqiiig.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

async function runSql(sql) {
  const endpoints = [
    `${url}/rest/v1/rpc/exec_sql`,
    `${url}/pg/v1/query`,
    `${url}/sql/v1`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
          "apikey": serviceKey,
        },
        body: JSON.stringify({ query: sql, sql: sql }),
      });
      const text = await res.text();
      console.log(`Response ${res.status}:`, text);
      if (res.ok) return true;
    } catch (e) {
      console.log(`Error on ${endpoint}:`, e.message);
    }
  }
  return false;
}

async function main() {
  const sql = fs.readFileSync("./supabase/migrations/0013_address_default_and_order_snapshots.sql", "utf8");
  await runSql(sql);
}

main();
