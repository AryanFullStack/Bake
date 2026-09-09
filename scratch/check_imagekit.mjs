import ImageKit from "imagekit";
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

const ikPublicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const ikPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const ikUrlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

console.log("ImageKit Endpoint:", ikUrlEndpoint);

const imagekit = new ImageKit({
  publicKey: ikPublicKey,
  privateKey: ikPrivateKey,
  urlEndpoint: ikUrlEndpoint,
});

async function listIK() {
  try {
    const files = await imagekit.listFiles({ limit: 100 });
    console.log(`ImageKit Total Files Found (limit 100): ${files.length}`);
    files.forEach(f => {
      console.log(`  [${f.fileId}] ${f.name} -> ${f.url} (${f.filePath})`);
    });
  } catch (err) {
    console.error("Error listing ImageKit files:", err);
  }
}

listIK();
