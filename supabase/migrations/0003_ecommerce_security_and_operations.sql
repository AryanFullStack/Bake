-- Bake Mart Bazaar production hardening: public catalog, private customer data,
-- admin authorization, inventory, tracking RPCs and Storage policies.

create schema if not exists private;

create table if not exists public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_low_stock_idx on public.inventory(quantity, low_stock_threshold);
create index if not exists products_created_at_idx on public.products(created_at desc, id desc);
create index if not exists products_bestseller_idx on public.products(is_bestseller, is_published, created_at desc);
create index if not exists products_featured_idx on public.products(is_featured, is_published, created_at desc);
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists order_items_product_idx on public.order_items(product_id);
create index if not exists reviews_product_approved_idx on public.reviews(product_id, is_approved, created_at desc);
create index if not exists custom_cakes_status_created_idx on public.custom_cake_requests(status, created_at desc);
create index if not exists custom_cakes_user_idx on public.custom_cake_requests(user_id, created_at desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists admin_logs_created_idx on public.admin_activity_logs(created_at desc);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'manager', 'fulfilment'));
$$;
revoke all on function private.is_admin() from public, anon, authenticated, service_role;

create or replace function public.sync_inventory_from_product()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.inventory(product_id, quantity, low_stock_threshold)
  values (new.id, new.stock_quantity, new.low_stock_threshold)
  on conflict (product_id) do update set quantity = excluded.quantity, low_stock_threshold = excluded.low_stock_threshold, updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_sync_inventory on public.products;
create trigger products_sync_inventory after insert or update of stock_quantity, low_stock_threshold on public.products
for each row execute function public.sync_inventory_from_product();

insert into public.inventory(product_id, quantity, low_stock_threshold)
select id, stock_quantity, low_stock_threshold from public.products
on conflict (product_id) do update set quantity = excluded.quantity, low_stock_threshold = excluded.low_stock_threshold, updated_at = now();

-- Catalog reads are public; all catalog writes are admin-only.
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.banners enable row level security;
alter table public.faqs enable row level security;
alter table public.site_settings enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.custom_cake_quotes enable row level security;
alter table public.custom_cake_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.email_outbox enable row level security;
alter table public.admin_activity_logs enable row level security;

create policy "public active categories" on public.categories for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "public brands" on public.brands for select to anon, authenticated using (true);
create policy "public published products" on public.products for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "public product images" on public.product_images for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.is_published or (select private.is_admin()))));
create policy "public active banners" on public.banners for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "public published faqs" on public.faqs for select to anon, authenticated using (is_published or (select private.is_admin()));

create policy "customers own carts" on public.carts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers own cart items" on public.cart_items for all to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy "customers own recently viewed" on public.recently_viewed for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers own quote" on public.custom_cake_quotes for select to authenticated using (exists (select 1 from public.custom_cake_requests r where r.id = request_id and r.user_id = (select auth.uid())));
create policy "customers own cake history" on public.custom_cake_status_history for select to authenticated using (exists (select 1 from public.custom_cake_requests r where r.id = request_id and r.user_id = (select auth.uid())));
create policy "customers own notifications" on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "admins manage categories" on public.categories for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage brands" on public.brands for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage products" on public.products for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage product images" on public.product_images for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage banners" on public.banners for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage faqs" on public.faqs for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage settings" on public.site_settings for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage inventory" on public.inventory for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage profiles" on public.profiles for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()) or (select auth.uid()) = id);
create policy "admins manage orders" on public.orders for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage order items" on public.order_items for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage payments" on public.payments for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage order history" on public.order_status_history for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage customers cakes" on public.custom_cake_requests for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage cake images" on public.custom_cake_images for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage cake quotes" on public.custom_cake_quotes for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage cake history" on public.custom_cake_status_history for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage reviews" on public.reviews for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage email outbox" on public.email_outbox for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage logs" on public.admin_activity_logs for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own reviews" on public.reviews;
create policy "customers write verified reviews" on public.reviews for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.orders o join public.order_items oi on oi.order_id = o.id where o.id = order_id and oi.product_id = product_id and o.user_id = (select auth.uid()) and o.status = 'delivered'
  )
);

create or replace function public.create_guest_order(p_customer jsonb, p_payment_method public.payment_method, p_items jsonb)
returns text language plpgsql security definer set search_path = public
as $$
declare item jsonb; product_row public.products%rowtype; v_order_id uuid; v_order_number text; v_subtotal numeric := 0; v_delivery numeric := 0; v_quantity integer; v_line numeric; v_user_id uuid := auth.uid();
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 100 then raise exception 'Invalid quantity'; end if;
    select * into product_row from public.products where id = (item->>'product_id')::uuid and is_published = true for update;
    if product_row.id is null or product_row.stock_quantity < v_quantity then raise exception 'One or more products are unavailable'; end if;
    v_line := coalesce(product_row.sale_price, product_row.price) * v_quantity; v_subtotal := v_subtotal + v_line;
  end loop;
  if v_subtotal < 3000 then v_delivery := 250; end if;
  v_order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  insert into public.orders(order_number, user_id, customer_name, customer_phone, customer_email, city, area, delivery_address, landmark, delivery_instructions, subtotal, delivery_fee, total, payment_method)
  values(v_order_number, v_user_id, nullif(trim(p_customer->>'full_name'),''), regexp_replace(trim(p_customer->>'phone'), '\s+', '', 'g'), nullif(trim(p_customer->>'email'),''), trim(p_customer->>'city'), trim(p_customer->>'area'), trim(p_customer->>'address'), nullif(trim(p_customer->>'landmark'),''), nullif(trim(p_customer->>'instructions'),''), v_subtotal, v_delivery, v_subtotal + v_delivery, p_payment_method) returning id into v_order_id;
  for item in select * from jsonb_array_elements(p_items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid for update; v_quantity := (item->>'quantity')::integer; v_line := coalesce(product_row.sale_price, product_row.price) * v_quantity;
    insert into public.order_items(order_id, product_id, product_name, sku, unit_price, quantity, line_total) values(v_order_id, product_row.id, product_row.name, product_row.sku, coalesce(product_row.sale_price, product_row.price), v_quantity, v_line);
    update public.products set stock_quantity = stock_quantity - v_quantity where id = product_row.id;
  end loop;
  insert into public.payments(order_id, method, status) values(v_order_id, p_payment_method, case when p_payment_method = 'bank_transfer' then 'pending_verification' else 'pending' end);
  insert into public.order_status_history(order_id, new_status) values(v_order_id, 'placed');
  return v_order_number;
end;
$$;
revoke all on function public.create_guest_order(jsonb, public.payment_method, jsonb) from public;
grant execute on function public.create_guest_order(jsonb, public.payment_method, jsonb) to anon, authenticated;

create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb language sql security definer set search_path = public
as $$
  select to_jsonb(o) || jsonb_build_object('history', coalesce((select jsonb_agg(h order by h.created_at) from public.order_status_history h where h.order_id = o.id), '[]'::jsonb))
  from public.orders o
  where upper(o.order_number) = upper(trim(p_order_number)) and regexp_replace(o.customer_phone, '[^0-9]', '', 'g') = regexp_replace(trim(p_phone), '[^0-9]', '', 'g');
$$;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;

create sequence if not exists public.custom_cake_request_seq start 1000;
create or replace function public.create_custom_cake_request(p_payload jsonb)
returns text language plpgsql security definer set search_path = public
as $$
declare v_request_number text := 'BM-CR-' || lpad(nextval('public.custom_cake_request_seq')::text, 4, '0'); v_request_id uuid;
begin
  insert into public.custom_cake_requests(request_number, user_id, customer_name, phone, email, city, area, delivery_address, landmark, delivery_instructions, preferred_delivery_at, cake_type, cake_size, flavor, quantity, theme, cake_message, budget, special_instructions)
  values (v_request_number, auth.uid(), p_payload->>'full_name', p_payload->>'phone', nullif(p_payload->>'email',''), p_payload->>'city', p_payload->>'area', p_payload->>'address', nullif(p_payload->>'landmark',''), nullif(p_payload->>'instructions',''), nullif(p_payload->>'preferred_delivery_at','')::timestamptz, p_payload->>'cake_type', p_payload->>'cake_size', p_payload->>'flavor', greatest(coalesce((p_payload->>'quantity')::integer,1),1), nullif(p_payload->>'theme',''), nullif(p_payload->>'cake_message',''), nullif(p_payload->>'budget','')::numeric, nullif(p_payload->>'special_instructions','')) returning id into v_request_id;
  insert into public.custom_cake_status_history(request_id, new_status) values (v_request_id, 'submitted');
  return v_request_number;
end;
$$;
revoke all on function public.create_custom_cake_request(jsonb) from public;
grant execute on function public.create_custom_cake_request(jsonb) to anon, authenticated;

create or replace function public.track_custom_cake(p_request_number text, p_phone text)
returns jsonb language sql security definer set search_path = public
as $$
  select to_jsonb(r) || jsonb_build_object('history', coalesce((select jsonb_agg(h order by h.created_at) from public.custom_cake_status_history h where h.request_id = r.id), '[]'::jsonb), 'quote', (select to_jsonb(q) from public.custom_cake_quotes q where q.request_id = r.id))
  from public.custom_cake_requests r
  where upper(r.request_number) = upper(trim(p_request_number)) and regexp_replace(r.phone, '[^0-9]', '', 'g') = regexp_replace(trim(p_phone), '[^0-9]', '', 'g');
$$;
revoke all on function public.track_custom_cake(text, text) from public;
grant execute on function public.track_custom_cake(text, text) to anon, authenticated;

insert into storage.buckets(id, name, public) values
  ('product-images', 'product-images', true), ('category-images', 'category-images', true), ('banners', 'banners', true),
  ('custom-cake-references', 'custom-cake-references', false), ('payment-receipts', 'payment-receipts', false)
on conflict (id) do update set public = excluded.public;

create policy "public catalog storage read" on storage.objects for select to anon, authenticated using (bucket_id in ('product-images','category-images','banners'));
create policy "admins manage public storage" on storage.objects for all to authenticated using ((select private.is_admin()) and bucket_id in ('product-images','category-images','banners')) with check ((select private.is_admin()) and bucket_id in ('product-images','category-images','banners'));
create policy "customers upload private cake refs" on storage.objects for insert to anon, authenticated with check (bucket_id = 'custom-cake-references');
create policy "admins manage private storage" on storage.objects for all to authenticated using ((select private.is_admin()) and bucket_id in ('custom-cake-references','payment-receipts')) with check ((select private.is_admin()) and bucket_id in ('custom-cake-references','payment-receipts'));
