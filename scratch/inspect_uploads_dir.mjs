import fs from "fs";
import path from "path";

const uploadsDir = "D:\\bakery\\uploads";
console.log("Inspecting", uploadsDir);

function scan(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scan(full);
    } else {
      console.log("File:", full);
    }
  }
}

if (fs.existsSync(uploadsDir)) {
  scan(uploadsDir);
} else {
  console.log("Uploads dir does not exist.");
}
