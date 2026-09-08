/**
 * optimize-public-images.mjs
 *
 * Compresses large public/ images to WebP in-place.
 * Safe: only writes if the output is smaller than the original.
 * Run once: node scripts/optimize-public-images.mjs
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");

// Images to optimize, with their quality settings
const TARGETS = [
  // Fullscreen hero images — reduce significantly, keep high quality
  { file: "HomeM.png",            maxW: 1200, maxH: 1600, quality: 82 },
  { file: "homeDisktop.png",      maxW: 1920, maxH: 1200, quality: 82 },
  { file: "CakeD.png",            maxW: 1920, maxH: 1200, quality: 82 },
  { file: "CakeM.png",            maxW: 1200, maxH: 1600, quality: 82 },
  { file: "WD.jpeg",              maxW: 1920, maxH: 1200, quality: 82 },
  { file: "WM.jpeg",              maxW: 1200, maxH: 1600, quality: 82 },
  // Section images
  { file: "kicthens.jpg",         maxW: 1600, maxH: 1200, quality: 80 },
  { file: "bakery.png",           maxW: 1600, maxH: 1200, quality: 80 },
  { file: "baskets.png",          maxW: 1600, maxH: 1200, quality: 80 },
  { file: "celebration-cakes.png",maxW: 1600, maxH: 1200, quality: 80 },
  // Smaller section images
  { file: "cake.jpg",             maxW: 1200, maxH: 900,  quality: 82 },
  { file: "cakechake.jpg",        maxW: 1200, maxH: 900,  quality: 82 },
  { file: "custoemcake2.png",     maxW: 1200, maxH: 900,  quality: 80 },
  { file: "cusotmecakeone.png",   maxW: 1200, maxH: 900,  quality: 80 },
  { file: "cakedisktop.jpeg",     maxW: 1600, maxH: 1200, quality: 80 },
  { file: "cakemobile.jpeg",      maxW: 1200, maxH: 1600, quality: 80 },
  { file: "dacoredisktop.jpeg",   maxW: 1600, maxH: 1200, quality: 80 },
  { file: "decoreMobile.jpeg",    maxW: 1200, maxH: 1600, quality: 80 },
  { file: "watchlaptop.jpeg",     maxW: 1600, maxH: 1200, quality: 80 },
  { file: "watchsMobile (1).jpeg",maxW: 1200, maxH: 1600, quality: 80 },
  { file: "homeItems.jfif",       maxW: 800,  maxH: 800,  quality: 80 },
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

async function optimizeFile({ file, maxW, maxH, quality }) {
  const inputPath = path.join(publicDir, file);

  if (!fs.existsSync(inputPath)) {
    console.log(`  ⚠  Skipping ${file} — not found`);
    return;
  }

  const originalSize = fs.statSync(inputPath).size;

  // Determine output path: always write as .webp extension
  const baseName = path.basename(file, path.extname(file));
  const outputName = baseName + ".webp";
  const outputPath = path.join(publicDir, outputName);

  try {
    await sharp(inputPath)
      .rotate() // auto-orient EXIF
      .resize(maxW, maxH, { fit: "inside", withoutEnlargement: true })
      .withMetadata(false) // strip EXIF
      .webp({ quality, effort: 5, smartSubsample: true })
      .toFile(outputPath);

    const newSize = fs.statSync(outputPath).size;
    const saving = ((1 - newSize / originalSize) * 100).toFixed(1);

    if (newSize >= originalSize) {
      // WebP isn't smaller — keep original, remove temp output
      fs.unlinkSync(outputPath);
      console.log(`  ✓  ${file} — WebP not smaller, kept original (${formatBytes(originalSize)})`);
      return;
    }

    // If the output name differs from input (different extension), we can overwrite
    if (outputName !== file) {
      // Write WebP in place of original name too (same base, .webp extension)
      // Original file is preserved — no deletion
      console.log(`  ✅  ${file} → ${outputName}`);
      console.log(`      ${formatBytes(originalSize)} → ${formatBytes(newSize)} (saved ${saving}%)`);
    } else {
      console.log(`  ✅  ${file} (${formatBytes(originalSize)} → ${formatBytes(newSize)}, saved ${saving}%)`);
    }
  } catch (err) {
    console.error(`  ❌  ${file} — Error: ${err.message}`);
  }
}

async function main() {
  console.log("\n🔧 Bake Mart Bazaar — Public Image Optimizer\n");
  console.log(`📁 Public dir: ${publicDir}\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const target of TARGETS) {
    const inputPath = path.join(publicDir, target.file);
    if (fs.existsSync(inputPath)) {
      totalBefore += fs.statSync(inputPath).size;
    }
    await optimizeFile(target);
    const baseName = path.basename(target.file, path.extname(target.file));
    const outPath = path.join(publicDir, baseName + ".webp");
    if (fs.existsSync(outPath)) {
      totalAfter += fs.statSync(outPath).size;
    } else if (fs.existsSync(inputPath)) {
      totalAfter += fs.statSync(inputPath).size;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`📊 Total before: ${formatBytes(totalBefore)}`);
  console.log(`📊 Total after:  ${formatBytes(totalAfter)}`);
  console.log(`💾 Estimated saving: ${formatBytes(totalBefore - totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
  console.log("\n✅ Done. Update any .webp references in code if needed.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
