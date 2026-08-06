-- Demo catalogue only. This is intentionally database seed data, not app code.
-- Replace or remove this file when importing the client's 700+ SKU catalogue.

insert into public.categories (name, slug, description, image_path, sort_order, is_active) values
  ('Celebration Cakes', 'cakes', 'Layer cakes, cream cakes and celebration centrepieces.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', 1, true),
  ('Pastries', 'pastries', 'Flaky morning bakes and buttery tea-time favourites.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85', 2, true),
  ('Cupcakes', 'cupcakes', 'Small-batch cupcakes for gifting and sharing.', 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=85', 3, true),
  ('Brownies', 'brownies', 'Dense, fudgy trays with generous chocolate.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', 4, true),
  ('Cookies', 'cookies', 'Crisp edges, soft centres and bakery-fresh boxes.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85', 5, true),
  ('Desserts', 'desserts', 'Individual desserts for sweet little moments.', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85', 6, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, image_path = excluded.image_path, is_active = excluded.is_active;

insert into public.brands (name, slug) values
  ('Bake Mart Signature', 'bake-mart-signature'), ('The Daily Oven', 'the-daily-oven'), ('Sweet Street', 'sweet-street')
on conflict (slug) do nothing;

insert into public.products (category_id, brand_id, sku, slug, name, description, price, sale_price, stock_quantity, low_stock_threshold, is_published, is_featured, is_bestseller, seo_title, seo_description, tags)
select c.id, b.id, x.sku, x.slug, x.name, x.description, x.price, x.sale_price, x.stock_quantity, 5, true, x.is_featured, x.is_bestseller, x.name || ' | Bake Mart Bazaar', x.description, x.tags
from (values
  ('BMB-CAKE-001','signature-chocolate-fudge-cake','Signature Chocolate Fudge Cake','Three layers of dark chocolate sponge, silky ganache and a gentle touch of sea salt.',3200,2790,12,true,true,array['chocolate','celebration']),
  ('BMB-CAKE-002','rose-vanilla-celebration-cake','Rose Vanilla Celebration Cake','Soft vanilla sponge with rose cream, raspberry preserve and hand-finished petals.',3600,null,8,true,false,array['vanilla','birthday']),
  ('BMB-PAST-001','almond-croissant-box','Almond Croissant Box','Buttery, flaky layers filled with almond cream and finished with toasted almonds.',1650,1490,22,true,true,array['breakfast','almond']),
  ('BMB-CUP-001','salted-caramel-cupcake-box','Salted Caramel Cupcake Box','Six tender vanilla cupcakes crowned with caramel buttercream and a caramel drip.',1350,null,18,true,false,array['caramel','gift']),
  ('BMB-BRWN-001','dark-chocolate-brownie-slab','Dark Chocolate Brownie Slab','Dense, fudgy brownie with roasted walnuts and a glossy chocolate top.',1100,950,30,false,true,array['chocolate','walnut']),
  ('BMB-COOK-001','pistachio-sea-salt-cookies','Pistachio Sea Salt Cookies','Crisp edges, soft centres, roasted pistachio and a pinch of sea salt.',850,null,40,false,false,array['pistachio','cookies']),
  ('BMB-DESS-001','mango-cream-tres-leches','Mango Cream Tres Leches','A cloud-soft milk cake layered with fresh mango and vanilla cream.',980,null,16,false,false,array['mango','dessert']),
  ('BMB-CAKE-003','red-velvet-cream-cheese-cake','Red Velvet Cream Cheese Cake','Classic red velvet sponge with smooth cream cheese frosting and cocoa crumb.',3400,null,7,true,true,array['red velvet','cream cheese'])) as x(sku,slug,name,description,price,sale_price,stock_quantity,is_featured,is_bestseller,tags)
join public.categories c on c.slug = case when x.slug like '%cake%' or x.slug like '%velvet%' then 'cakes' when x.slug like '%croissant%' then 'pastries' when x.slug like '%cupcake%' then 'cupcakes' when x.slug like '%brownie%' then 'brownies' when x.slug like '%cookie%' then 'cookies' else 'desserts' end
join public.brands b on b.slug = 'bake-mart-signature'
on conflict (sku) do update set name = excluded.name, description = excluded.description, price = excluded.price, sale_price = excluded.sale_price, stock_quantity = excluded.stock_quantity, is_published = true, is_featured = excluded.is_featured, is_bestseller = excluded.is_bestseller, tags = excluded.tags;

insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id,
  case p.slug
    when 'signature-chocolate-fudge-cake' then 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=88'
    when 'rose-vanilla-celebration-cake' then 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1200&q=88'
    when 'almond-croissant-box' then 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=88'
    when 'salted-caramel-cupcake-box' then 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=88'
    when 'dark-chocolate-brownie-slab' then 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=88'
    when 'pistachio-sea-salt-cookies' then 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=88'
    when 'mango-cream-tres-leches' then 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=88'
    else 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=1200&q=88'
  end, p.name, 0
from public.products p
on conflict do nothing;

insert into public.banners (title, body, image_path, cta_label, cta_href, is_active, sort_order) values
  ('A little more joy in every bite.', 'Premium cakes, flaky pastries and tiny celebrations baked fresh in our kitchen.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=88', 'Shop freshly baked', '/shop', true, 1),
  ('Your idea, our icing.', 'Tell us what would make your moment extra special.', 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=1600&q=88', 'Start a custom cake', '/custom-cake', true, 2)
on conflict do nothing;

insert into public.faqs (question, answer, sort_order, is_published) values
  ('How fresh are the bakes?', 'Every product is prepared in small batches and packed for your delivery window.', 1, true),
  ('Where do you deliver?', 'We currently accept orders for Lahore and nearby delivery areas. Add more cities in Admin settings.', 2, true),
  ('Can I order a custom cake?', 'Yes. Share your cake brief and reference image through the Custom Cake Studio and our team will prepare a quote.', 3, true),
  ('Which payment methods are available?', 'Cash on Delivery and bank transfer are available. Bank transfer orders are dispatched after receipt verification.', 4, true)
on conflict do nothing;

insert into public.site_settings (key, value) values
  ('store', '{"name":"Bake Mart Bazaar","email":"hello@bakemartbazaar.pk","phone":"0321-1234567","city":"Lahore, Pakistan"}'),
  ('delivery', '{"free_threshold":3000,"fee":250,"same_day_cutoff":"13:00","cities":["Lahore","Islamabad","Rawalpindi","Karachi"]}'),
  ('seed_metadata', '{"source":"demo-seed","replaceable":true,"note":"Replace with the client catalogue import."}')
on conflict (key) do update set value = excluded.value;
