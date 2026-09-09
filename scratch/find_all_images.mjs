import fs from "fs";
import path from "path";

function findFiles(dir, maxDepth = 6, currentDepth = 0) {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return [];
  let results = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name.startsWith("node_modules") || item.name.startsWith(".git") || item.name.startsWith(".next")) continue;
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(findFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (/\.(webp|jpg|jpeg|png|gif|jfif)$/i.test(item.name)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Ignore permissions
  }
  return results;
}

console.log("=== ALL IMAGES IN D:\\bakery ===");
const foundInBakery = findFiles("D:\\bakery", 6);
foundInBakery.forEach(f => console.log("  ", f));
