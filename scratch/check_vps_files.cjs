const path = require('path');
const fs = require('fs');
const { LocalStorageProvider } = require('../lib/media/storage-provider.ts');

const provider = new LocalStorageProvider();
console.log('Base directory:', provider.getBaseDir());

async function check() {
  const testFile = 'products/product_1788636356_981a25.webp';
  const exists = await provider.fileExists(testFile);
  console.log(`File ${testFile} exists:`, exists);

  const stats = await provider.getFolderStats();
  console.log('Folder stats:', stats);

  const files = await provider.listFiles();
  console.log(`Total files found on disk: ${files.length}`);
  if (files.length > 0) {
    console.log('Sample files:', files.slice(0, 5));
  }
}

check();
