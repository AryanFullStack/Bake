/**
 * Demo data seed script — uses Supabase JS client (service role).
 * Run once:  node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dgipjdyzcugtegfqiiig.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  console.log('🌱 Seeding database…');

  // ── Categories ────────────────────────────────────────────────────────────
  const categories = [
    { name: 'Bakery', slug: 'bakery', description: 'Freshly baked cakes, pastries & desserts.', image_path: '/bakery.png', sort_order: 1, is_active: true },
    { name: 'Celebration Cakes', slug: 'cakes', description: 'Layer cakes, cream cakes and celebration centrepieces.', image_path: '/celebration-cakes.png', sort_order: 2, is_active: true },
    { name: 'Baskets & Storage', slug: 'baskets', description: 'Organise your home beautifully.', image_path: '/baskets.png', sort_order: 3, is_active: true },
    { name: 'Watches', slug: 'watches', description: 'Classic & modern timepieces.', image_path: '/WD.jpeg', sort_order: 4, is_active: true },
    { name: 'Kitchen Essentials', slug: 'kitchen', description: 'Utensils, storage & accessories.', image_path: '/kicthens.jpg', sort_order: 5, is_active: true },
    { name: 'Home Decoration', slug: 'home-decor', description: 'Vases, wall art & decorative items.', image_path: '/homeDisktop.png', sort_order: 6, is_active: true },
  ];

  const { error: catErr } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' });
  if (catErr) throw new Error('categories: ' + catErr.message);
  console.log('  ✔ categories');

  // ── Brands ────────────────────────────────────────────────────────────────
  const { error: brandErr } = await supabase
    .from('brands')
    .upsert(
      [
        { name: 'Bake Mart Signature', slug: 'bake-mart-signature' },
        { name: 'The Daily Oven', slug: 'the-daily-oven' },
        { name: 'Sweet Street', slug: 'sweet-street' },
      ],
      { onConflict: 'slug', ignoreDuplicates: true }
    );
  if (brandErr) throw new Error('brands: ' + brandErr.message);
  console.log('  ✔ brands');

  // ── Fetch IDs we need ─────────────────────────────────────────────────────
  const { data: cats } = await supabase.from('categories').select('id, slug');
  const { data: brands } = await supabase.from('brands').select('id, slug');
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  const bmsId = brands.find((b) => b.slug === 'bake-mart-signature').id;

  // ── Products ──────────────────────────────────────────────────────────────
  const productRows = [
    { sku: 'BMB-CAKE-001', slug: 'signature-chocolate-fudge-cake', name: 'Signature Chocolate Fudge Cake', description: 'Three layers of dark chocolate sponge, silky ganache and a gentle touch of sea salt.', price: 3200, sale_price: 2790, stock_quantity: 12, is_featured: true, is_bestseller: true, tags: ['chocolate', 'celebration'], catSlug: 'cakes' },
    { sku: 'BMB-CAKE-002', slug: 'rose-vanilla-celebration-cake', name: 'Rose Vanilla Celebration Cake', description: 'Soft vanilla sponge with rose cream, raspberry preserve and hand-finished petals.', price: 3600, sale_price: null, stock_quantity: 8, is_featured: true, is_bestseller: false, tags: ['vanilla', 'birthday'], catSlug: 'cakes' },
    { sku: 'BMB-CAKE-003', slug: 'red-velvet-cream-cheese-cake', name: 'Red Velvet Cream Cheese Cake', description: 'Classic red velvet sponge with smooth cream cheese frosting and cocoa crumb.', price: 3400, sale_price: null, stock_quantity: 7, is_featured: true, is_bestseller: true, tags: ['red velvet', 'cream cheese'], catSlug: 'cakes' },
    { sku: 'BMB-PAST-001', slug: 'almond-croissant-box', name: 'Almond Croissant Box', description: 'Buttery, flaky layers filled with almond cream and finished with toasted almonds.', price: 1650, sale_price: 1490, stock_quantity: 22, is_featured: true, is_bestseller: true, tags: ['breakfast', 'almond'], catSlug: 'pastries' },
    { sku: 'BMB-CUP-001', slug: 'salted-caramel-cupcake-box', name: 'Salted Caramel Cupcake Box', description: 'Six tender vanilla cupcakes crowned with caramel buttercream and a caramel drip.', price: 1350, sale_price: null, stock_quantity: 18, is_featured: true, is_bestseller: false, tags: ['caramel', 'gift'], catSlug: 'cupcakes' },
    { sku: 'BMB-BRWN-001', slug: 'dark-chocolate-brownie-slab', name: 'Dark Chocolate Brownie Slab', description: 'Dense, fudgy brownie with roasted walnuts and a glossy chocolate top.', price: 1100, sale_price: 950, stock_quantity: 30, is_featured: false, is_bestseller: true, tags: ['chocolate', 'walnut'], catSlug: 'brownies' },
    { sku: 'BMB-COOK-001', slug: 'pistachio-sea-salt-cookies', name: 'Pistachio Sea Salt Cookies', description: 'Crisp edges, soft centres, roasted pistachio and a pinch of sea salt.', price: 850, sale_price: null, stock_quantity: 40, is_featured: false, is_bestseller: false, tags: ['pistachio', 'cookies'], catSlug: 'cookies' },
    { sku: 'BMB-DESS-001', slug: 'mango-cream-tres-leches', name: 'Mango Cream Tres Leches', description: 'A cloud-soft milk cake layered with fresh mango and vanilla cream.', price: 980, sale_price: null, stock_quantity: 16, is_featured: false, is_bestseller: false, tags: ['mango', 'dessert'], catSlug: 'desserts' },
  ];

  const products = productRows.map(({ catSlug, ...p }) => ({
    ...p,
    category_id: catMap[catSlug],
    brand_id: bmsId,
    low_stock_threshold: 5,
    is_published: true,
    seo_title: p.name + ' | Bake Mart Bazaar',
    seo_description: p.description,
  }));

  const { error: prodErr } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'sku' });
  if (prodErr) throw new Error('products: ' + prodErr.message);
  console.log('  ✔ products');

  // ── Product images ────────────────────────────────────────────────────────
  const imageMap = {
    'signature-chocolate-fudge-cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=88',
    'rose-vanilla-celebration-cake': 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1200&q=88',
    'red-velvet-cream-cheese-cake': 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=1200&q=88',
    'almond-croissant-box': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=88',
    'salted-caramel-cupcake-box': 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=88',
    'dark-chocolate-brownie-slab': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=88',
    'pistachio-sea-salt-cookies': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=88',
    'mango-cream-tres-leches': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=88',
  };

  const { data: insertedProducts } = await supabase.from('products').select('id, slug');
  const productIds = insertedProducts.map((p) => p.id);

  // Delete existing images for these products so we can re-insert cleanly
  await supabase.from('product_images').delete().in('product_id', productIds);

  const images = insertedProducts.map((p) => ({
    product_id: p.id,
    storage_path: imageMap[p.slug] ?? 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=1200&q=88',
    alt_text: productRows.find((r) => r.slug === p.slug)?.name ?? p.slug,
    sort_order: 0,
  }));

  const { error: imgErr } = await supabase.from('product_images').insert(images);
  if (imgErr) throw new Error('product_images: ' + imgErr.message);
  console.log('  ✔ product_images');

  // ── Banners ───────────────────────────────────────────────────────────────
  const { error: bannerErr } = await supabase
    .from('banners')
    .upsert(
      [
        { title: 'A little more joy in every bite.', body: 'Premium cakes, flaky pastries and tiny celebrations baked fresh in our kitchen.', image_path: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=88', cta_label: 'Shop freshly baked', cta_href: '/shop', is_active: true, sort_order: 1 },
        { title: 'Your idea, our icing.', body: 'Tell us what would make your moment extra special.', image_path: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=1600&q=88', cta_label: 'Start a custom cake', cta_href: '/custom-cake', is_active: true, sort_order: 2 },
      ],
      { ignoreDuplicates: true }
    );
  if (bannerErr) throw new Error('banners: ' + bannerErr.message);
  console.log('  ✔ banners');

  // ── FAQs ──────────────────────────────────────────────────────────────────
  const { error: faqErr } = await supabase
    .from('faqs')
    .upsert(
      [
        { question: 'How fresh are the bakes?', answer: 'Every product is prepared in small batches and packed for your delivery window.', sort_order: 1, is_published: true },
        { question: 'Where do you deliver?', answer: 'We currently accept orders for Lahore and nearby delivery areas. Add more cities in Admin settings.', sort_order: 2, is_published: true },
        { question: 'Can I order a custom cake?', answer: 'Yes. Share your cake brief and reference image through the Custom Cake Studio and our team will prepare a quote.', sort_order: 3, is_published: true },
        { question: 'Which payment methods are available?', answer: 'Cash on Delivery and bank transfer are available. Bank transfer orders are dispatched after receipt verification.', sort_order: 4, is_published: true },
      ],
      { ignoreDuplicates: true }
    );
  if (faqErr) throw new Error('faqs: ' + faqErr.message);
  console.log('  ✔ faqs');

  // ── Site settings ─────────────────────────────────────────────────────────
  const { error: settingsErr } = await supabase
    .from('site_settings')
    .upsert(
      [
        { key: 'store', value: { name: 'Bake Mart Bazaar', email: 'hello@bakemartbazaar.pk', phone: '0321-1234567', city: 'Lahore, Pakistan' } },
        { key: 'delivery', value: { free_threshold: 3000, fee: 250, same_day_cutoff: '13:00', cities: ['Lahore', 'Islamabad', 'Rawalpindi', 'Karachi'] } },
        { key: 'seed_metadata', value: { source: 'demo-seed', replaceable: true, note: 'Replace with the client catalogue import.' } },
      ],
      { onConflict: 'key' }
    );
  if (settingsErr) throw new Error('site_settings: ' + settingsErr.message);
  console.log('  ✔ site_settings');

  console.log('\n✅ Seed complete — 8 products across 6 categories.');
}

run().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
