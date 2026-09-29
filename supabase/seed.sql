-- ============================================================================
-- Bake Mart Bazaar - Production & Demo Seed Data
-- File: supabase/seed.sql
-- Description: Professional bakery catalogue, verified Pakistani customer reviews,
--              delivered orders, banners, FAQs, and store settings.
-- ============================================================================

-- 1. CATEGORIES
insert into public.categories (name, slug, description, image_path, sort_order, is_active) values
  ('Celebration Cakes', 'cakes', 'Layer cakes, cream cakes and celebration centrepieces.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', 1, true),
  ('Pastries', 'pastries', 'Flaky morning bakes and buttery tea-time favourites.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85', 2, true),
  ('Cupcakes', 'cupcakes', 'Small-batch cupcakes for gifting and sharing.', 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=85', 3, true),
  ('Brownies', 'brownies', 'Dense, fudgy trays with generous chocolate.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', 4, true),
  ('Cookies', 'cookies', 'Crisp edges, soft centres and bakery-fresh boxes.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85', 5, true),
  ('Desserts', 'desserts', 'Individual desserts for sweet little moments.', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85', 6, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, image_path = excluded.image_path, is_active = excluded.is_active;

-- 2. BRANDS
insert into public.brands (name, slug) values
  ('Bake Mart Signature', 'bake-mart-signature'),
  ('The Daily Oven', 'the-daily-oven'),
  ('Sweet Street', 'sweet-street')
on conflict (slug) do nothing;

-- 3. PROFESSIONAL BAKERY PRODUCTS
insert into public.products (category_id, brand_id, sku, slug, name, description, short_description, price, sale_price, stock_quantity, low_stock_threshold, is_published, status, is_featured, is_bestseller, seo_title, seo_description, tags, featured_image)
select c.id, b.id, x.sku, x.slug, x.name, x.description, x.short_description, x.price, x.sale_price, x.stock_quantity, 5, true, 'published', x.is_featured, x.is_bestseller, x.name || ' | Bake Bazaar Mart Karachi', x.short_description, x.tags, x.featured_image
from (values
  ('BMB-CAKE-001','signature-chocolate-fudge-cake','Signature Chocolate Fudge Cake','Three layers of dark chocolate sponge, silky ganache and a gentle touch of sea salt. Baked fresh daily.','Rich dark chocolate sponge with silky chocolate ganache.',3200,2790,12,true,true,array['chocolate','celebration','birthday'],'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-CAKE-002','rose-vanilla-celebration-cake','Rose Vanilla Celebration Cake','Soft vanilla sponge with rose cream, raspberry preserve and hand-finished petals.','Elegant vanilla rose layer cake with raspberry preserve.',3600,null,8,true,false,array['vanilla','birthday','flowers'],'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-CAKE-003','red-velvet-cream-cheese-cake','Red Velvet Cream Cheese Cake','Classic red velvet sponge with smooth Philadelphia cream cheese frosting and cocoa crumb.','Traditional crimson cake with rich cream cheese frosting.',3400,null,7,true,true,array['red velvet','cream cheese','celebration'],'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-CAKE-004','belgian-triple-chocolate-malt-cake','Belgian Triple Chocolate Malt Cake','Handcrafted with imported Belgian cocoa, dark chocolate truffle ganache, and light malted chocolate sponge, crowned with hand-rolled chocolate pearls.','Dark Belgian chocolate sponge with malt syrup and milk chocolate crunch.',3450,3150,15,true,true,array['belgian','chocolate','malt','birthday'],'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-CAKE-005','lotus-biscoff-caramel-mousse-cake','Lotus Biscoff Caramel Mousse Cake','Crunchy Biscoff biscuit crust, vanilla sponge layered with caramelized Speculoos mousse and warm Biscoff spread drip.','Layered vanilla sponge with caramelized Lotus Biscoff mousse.',3650,3290,12,true,true,array['lotus','biscoff','caramel','speculoos'],'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-CAKE-006','classic-ny-cheesecake','Classic New York Baked Cheesecake','Baked gently in a traditional water bath for that iconic dense, creamy, and velvety texture on a golden butter graham crust.','Authentic slow-baked New York cheesecake with velvety cream cheese.',3800,null,10,true,false,array['cheesecake','new york','gourmet'],'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-CAKE-007','ferrero-hazelnut-drip-cake','Ferrero Rocher Hazelnut Drip Cake','Three layers of moist hazelnut sponge sandwiched with pure roasted hazelnut praline and Nutella frosting, topped with genuine Ferrero Rocher pralines.','Roasted hazelnut sponge, Nutella fudge buttercream and dark drip.',4200,3850,8,true,true,array['ferrero','hazelnut','nutella','luxury'],'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-CAKE-008','karachi-pineapple-cream-cake','Karachi Special Pineapple Cream Cake','Feather-light vanilla chiffon sponge soaked in sweet pineapple nectar, layered with juicy crushed pineapple chunks and dairy whipped cream.','Nostalgic Karachi classic vanilla pineapple sponge with whipped cream.',2600,2350,20,false,true,array['pineapple','traditional','fresh cream'],'https://images.unsplash.com/photo-1562772186-085d7946b3d5?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-PAST-001','almond-croissant-box','Almond Croissant Box','Buttery, flaky layers filled with almond cream and finished with toasted almonds.','Flaky artisan croissants filled with rich almond frangipane.',1650,1490,22,true,true,array['breakfast','almond','croissant'],'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-PAST-002','butter-croissant-pack-of-4','Classic French Butter Croissants (Pack of 4)','Handcrafted with 82% fat cultured European butter, featuring 27 micro-layers for a shatteringly crisp exterior and honeycomb center.','Authentic 27-layer butter croissants baked fresh daily.',1450,1250,25,true,true,array['croissant','butter','french','breakfast'],'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-PAST-003','pain-au-chocolat-pack-of-4','Pain au Chocolat (Pack of 4)','Crisp, golden buttery pastry ribbons enveloping two generous batons of dark Belgian chocolate.','French laminated chocolate puff pastry with dark Belgian chocolate.',1650,null,18,false,true,array['chocolate','pastry','croissant'],'https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-BRWN-001','dark-chocolate-brownie-slab','Dark Chocolate Brownie Slab','Dense, fudgy brownie with roasted walnuts and a glossy chocolate top.','Deep dark chocolate fudge brownie with toasted walnuts.',1100,950,30,false,true,array['chocolate','walnut','brownie'],'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-BRWN-002','fudgy-nutella-walnut-brownies','Fudgy Nutella Walnut Brownie Box (6 Pieces)','Pure dark chocolate batter churned with brown sugar, crunchy toasted Kashmiri walnuts, and generous ribbons of Nutella.','Thick fudge brownies swirled with rich Nutella and walnuts.',1550,1350,30,true,true,array['brownies','nutella','walnut','fudgy'],'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-COOK-001','pistachio-sea-salt-cookies','Pistachio Sea Salt Cookies','Crisp edges, soft centres, roasted pistachio and a pinch of sea salt.','Handcrafted cookies with roasted pistachio and sea salt crystals.',850,null,40,false,false,array['pistachio','cookies','tea time'],'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-COOK-002','ny-chunky-chocochip-cookies','New York Chunky Chocochip Cookies (Box of 6)','Each oversized cookie is loaded to the brim with hand-cut Belgian chocolate chunks and a touch of sea salt. Crispy rim, gooey center.','Giant New York style bakery cookies with melting chocolate chunks.',1200,1050,35,true,true,array['cookies','chocochip','new york','soft baked'],'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-COOK-003','khasta-cake-rusks-500g','Traditional Khasta Cake Rusks (500g Box)','Double-baked to golden perfection from freshly baked vanilla sponge cake, flavored with crushed green cardamom pods.','Cardamom-infused double-baked golden crispy tea rusks.',650,null,50,false,true,array['rusks','tea time','chai','traditional'],'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-CUP-001','salted-caramel-cupcake-box','Salted Caramel Cupcake Box','Six tender vanilla cupcakes crowned with caramel buttercream and a caramel drip.','Tender vanilla cupcakes with salted caramel buttercream.',1350,null,18,true,false,array['caramel','gift','cupcakes'],'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-CUP-002','red-velvet-cupcakes-box-6','Red Velvet & Cream Cheese Cupcakes (Box of 6)','Moist crimson sponge with subtle cocoa undertones, crowned with swirls of rich Philadelphia cream cheese frosting and red velvet dusting.','Velvety crimson cupcakes with vanilla cream cheese frosting.',1650,1450,20,true,true,array['cupcakes','red velvet','cream cheese','gifting'],'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-DESS-001','mango-cream-tres-leches','Mango Cream Tres Leches','A cloud-soft milk cake layered with fresh Sindhri mango and vanilla cream.','Three milk soaked sponge cake with sweet Sindhri mangoes.',980,null,16,false,false,array['mango','dessert','tres leches'],'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=88'),
  ('BMB-DESS-002','lotus-biscoff-tres-leches','Lotus Biscoff Tres Leches Milk Tub','Sponge cake punctured and drenched in a sweet trio of milks, topped with Lotus Speculoos cream and crunchy biscuit crumb.','Sweet milk soaked sponge cake with rich Lotus Biscoff cream.',1250,null,25,true,true,array['tres leches','milk cake','lotus','biscoff'],'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=85'),
  ('BMB-DESS-003','gulab-jamun-tres-leches','Shahi Gulab Jamun Fusion Tres Leches','Light sponge infused with real saffron and green cardamom milk, crowned with bite-sized soft gulab jamuns and crushed pistachios.','Royal fusion saffron milk cake topped with mini gulab jamuns.',1150,null,20,false,true,array['gulab jamun','fusion','desi','tres leches'],'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=85')
) as x(sku,slug,name,description,short_description,price,sale_price,stock_quantity,is_featured,is_bestseller,tags,featured_image)
join public.categories c on c.slug = case 
  when x.sku like 'BMB-CAKE%' then 'cakes' 
  when x.sku like 'BMB-PAST%' then 'pastries' 
  when x.sku like 'BMB-CUP%' then 'cupcakes' 
  when x.sku like 'BMB-BRWN%' then 'brownies' 
  when x.sku like 'BMB-COOK%' then 'cookies' 
  else 'desserts' 
end
join public.brands b on b.slug = 'bake-mart-signature'
on conflict (sku) do update set 
  name = excluded.name, 
  description = excluded.description, 
  short_description = excluded.short_description,
  price = excluded.price, 
  sale_price = excluded.sale_price, 
  stock_quantity = excluded.stock_quantity, 
  is_published = true, 
  is_featured = excluded.is_featured, 
  is_bestseller = excluded.is_bestseller, 
  tags = excluded.tags,
  featured_image = excluded.featured_image;

-- 4. PRODUCT IMAGES
insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, p.featured_image, p.name, 0
from public.products p
where p.featured_image is not null
on conflict do nothing;

-- 5. BANNERS
insert into public.banners (title, body, image_path, cta_label, cta_href, is_active, sort_order) values
  ('A little more joy in every bite.', 'Premium cakes, flaky pastries and tiny celebrations baked fresh in our kitchen.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=88', 'Shop freshly baked', '/shop', true, 1),
  ('Your idea, our icing.', 'Tell us what would make your moment extra special.', 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=1600&q=88', 'Start a custom cake', '/custom-cake', true, 2)
on conflict do nothing;

-- 6. FAQS
insert into public.faqs (question, answer, sort_order, is_published) values
  ('How fresh are the bakes?', 'Every product is prepared in small batches and packed fresh for your delivery window.', 1, true),
  ('Where do you deliver in Pakistan?', 'We deliver daily across Karachi with express same-day delivery. Bakery dry boxes, cookies, and kitchen essentials are delivered nationwide across Lahore, Islamabad, Rawalpindi, and other cities.', 2, true),
  ('Can I order a custom cake?', 'Yes. Share your cake brief and reference image through our Custom Cake Studio and our chef team will prepare a quote.', 3, true),
  ('Which payment methods are available?', 'Cash on Delivery (COD) and direct bank transfer are accepted. Bank transfer orders are dispatched after receipt verification.', 4, true)
on conflict do nothing;

-- 7. SITE SETTINGS
insert into public.site_settings (key, value) values
  ('store', '{"name":"Bake Bazaar Mart","email":"info@bakebazaarmart.com","phone":"+92 312 4516997","city":"Karachi, Pakistan"}'),
  ('delivery', '{"free_threshold":3000,"fee":250,"same_day_cutoff":"13:00","cities":["Karachi","Lahore","Islamabad","Rawalpindi"]}'),
  ('seed_metadata', '{"source":"demo-seed","replaceable":true,"note":"Production & verified reviews seed."}')
on conflict (key) do update set value = excluded.value;
