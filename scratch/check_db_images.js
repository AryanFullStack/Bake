const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dgipjdyzcugtegfqiiig.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- Checking Products Table Featured Images ---');
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, slug, featured_image')
    .limit(20);
  if (pErr) console.error('Products error:', pErr);
  else console.log('Products:', JSON.stringify(products, null, 2));

  console.log('\n--- Checking Product Images Table ---');
  const { data: images, error: iErr } = await supabase
    .from('product_images')
    .select('id, product_id, storage_path')
    .limit(20);
  if (iErr) console.error('Images error:', iErr);
  else console.log('Product Images:', JSON.stringify(images, null, 2));

  console.log('\n--- Checking Media Table ---');
  const { data: media, error: mErr } = await supabase
    .from('media')
    .select('id, storage_path, public_url, filename')
    .limit(20);
  if (mErr) console.error('Media error:', mErr);
  else console.log('Media Table:', JSON.stringify(media, null, 2));
}

main();
