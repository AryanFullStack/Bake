-- Variable products v2: normalized attributes, variation media/content,
-- product information, relationships, and order variation snapshots.

alter table public.products
  add column if not exists short_description text,
  add column if not exists specifications jsonb not null default '{}',
  add column if not exists ingredients text,
  add column if not exists care_instructions text,
  add column if not exists delivery_information text,
  add column if not exists return_policy text;

create table if not exists public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  slug text not null,
  display_type text not null default 'button' check (display_type in ('button', 'color', 'image')),
  sort_order integer not null default 0,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, slug)
);

create table if not exists public.product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.product_attributes(id) on delete cascade,
  label text not null,
  slug text not null,
  sort_order integer not null default 0,
  swatch_color text,
  swatch_image text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(attribute_id, slug)
);

alter table public.product_variations
  add column if not exists combination_key text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists specifications jsonb not null default '{}',
  add column if not exists weight numeric(12,3),
  add column if not exists dimensions jsonb not null default '{}';

create unique index if not exists product_variations_combination_key_idx
  on public.product_variations(product_id, combination_key)
  where combination_key is not null;

create table if not exists public.product_variation_images (
  id uuid primary key default gen_random_uuid(),
  variation_id uuid not null references public.product_variations(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists product_variation_featured_image_idx
  on public.product_variation_images(variation_id)
  where is_featured;
create index if not exists product_variation_images_sort_idx
  on public.product_variation_images(variation_id, sort_order);

create table if not exists public.product_faqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_relations (
  source_product_id uuid not null references public.products(id) on delete cascade,
  target_product_id uuid not null references public.products(id) on delete cascade,
  relation_type text not null check (relation_type in ('related', 'frequently_bought')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key(source_product_id, target_product_id, relation_type),
  check (source_product_id <> target_product_id)
);

alter table public.order_items
  add column if not exists variation_id uuid references public.product_variations(id) on delete set null,
  add column if not exists variation_attributes jsonb not null default '{}',
  add column if not exists variation_title text,
  add column if not exists image_path text;

create index if not exists order_items_variation_idx on public.order_items(variation_id);

alter table public.cart_items
  add column if not exists variation_id uuid references public.product_variations(id) on delete set null;

drop policy if exists "public read product variations" on public.product_variations;
create policy "public read active product variations" on public.product_variations
  for select to anon, authenticated
  using (status = 'active' and exists (
    select 1 from public.products p where p.id = product_id and p.is_published
  ));

alter table public.product_attributes enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.product_variation_images enable row level security;
alter table public.product_faqs enable row level security;
alter table public.product_relations enable row level security;

create policy "public product attributes" on public.product_attributes
  for select to anon, authenticated using (exists (
    select 1 from public.products p where p.id = product_id and p.is_published
  ));
create policy "public product attribute values" on public.product_attribute_values
  for select to anon, authenticated using (exists (
    select 1 from public.product_attributes a
    join public.products p on p.id = a.product_id
    where a.id = attribute_id and p.is_published
  ));
create policy "public product variation images" on public.product_variation_images
  for select to anon, authenticated using (exists (
    select 1 from public.product_variations v
    join public.products p on p.id = v.product_id
    where v.id = variation_id and p.is_published and v.status = 'active'
  ));
create policy "public product faqs" on public.product_faqs
  for select to anon, authenticated using (is_published and exists (
    select 1 from public.products p where p.id = product_id and p.is_published
  ));
create policy "public product relations" on public.product_relations
  for select to anon, authenticated using (exists (
    select 1 from public.products p where p.id = source_product_id and p.is_published
  ));

create policy "admins manage product attributes" on public.product_attributes
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage product attribute values" on public.product_attribute_values
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage product variation images" on public.product_variation_images
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage product faqs" on public.product_faqs
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins manage product relations" on public.product_relations
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create or replace function public.create_guest_order(p_customer jsonb, p_payment_method public.payment_method, p_items jsonb)
returns text language plpgsql security definer set search_path = public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  variation_row public.product_variations%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_variation_id uuid;
  v_quantity integer;
  v_subtotal numeric := 0;
  v_delivery numeric := 0;
  v_unit_price numeric;
  v_line numeric;
  v_user_id uuid := auth.uid();
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;

  for item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 100 then raise exception 'Invalid quantity'; end if;
    select * into product_row from public.products
      where id = (item->>'product_id')::uuid and is_published = true for update;
    if product_row.id is null then raise exception 'One or more products are unavailable'; end if;

    v_variation_id := nullif(item->>'variation_id', '')::uuid;
    if product_row.product_type = 'variable' then
      if v_variation_id is null then raise exception 'Please select all product options'; end if;
      select * into variation_row from public.product_variations
        where id = v_variation_id and product_id = product_row.id and status = 'active' for update;
      if variation_row.id is null or variation_row.stock_quantity < v_quantity then
        raise exception 'Selected product option is unavailable';
      end if;
      v_unit_price := coalesce(variation_row.sale_price, variation_row.regular_price);
    else
      if v_variation_id is not null then raise exception 'Invalid product option'; end if;
      if product_row.stock_quantity < v_quantity then raise exception 'One or more products are unavailable'; end if;
      v_unit_price := coalesce(product_row.sale_price, product_row.price);
    end if;
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
  end loop;

  if v_subtotal < 3000 then v_delivery := 250; end if;
  v_order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  insert into public.orders(order_number, user_id, customer_name, customer_phone, customer_email, city, area, delivery_address, landmark, delivery_instructions, subtotal, delivery_fee, total, payment_method)
  values(v_order_number, v_user_id, nullif(trim(p_customer->>'full_name'),''), regexp_replace(trim(p_customer->>'phone'), '\s+', '', 'g'), nullif(trim(p_customer->>'email'),''), trim(p_customer->>'city'), trim(p_customer->>'area'), trim(p_customer->>'address'), nullif(trim(p_customer->>'landmark'),''), nullif(trim(p_customer->>'instructions'),''), v_subtotal, v_delivery, v_subtotal + v_delivery, p_payment_method)
  returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid for update;
    v_quantity := (item->>'quantity')::integer;
    v_variation_id := nullif(item->>'variation_id', '')::uuid;
    if product_row.product_type = 'variable' then
      select * into variation_row from public.product_variations where id = v_variation_id and product_id = product_row.id and status = 'active' for update;
      v_unit_price := coalesce(variation_row.sale_price, variation_row.regular_price);
      v_line := v_unit_price * v_quantity;
      insert into public.order_items(order_id, product_id, variation_id, variation_attributes, variation_title, image_path, product_name, sku, unit_price, quantity, line_total)
      values(v_order_id, product_row.id, variation_row.id, variation_row.attributes, coalesce(variation_row.title, variation_row.name), coalesce(variation_row.image_url, (select storage_path from public.product_variation_images where variation_id = variation_row.id order by is_featured desc, sort_order limit 1)), coalesce(variation_row.title, product_row.name), variation_row.sku, v_unit_price, v_quantity, v_line);
      update public.product_variations set stock_quantity = stock_quantity - v_quantity, updated_at = now() where id = variation_row.id;
      update public.products set stock_quantity = (select coalesce(sum(stock_quantity), 0) from public.product_variations where product_id = product_row.id and status = 'active'), updated_at = now() where id = product_row.id;
    else
      v_unit_price := coalesce(product_row.sale_price, product_row.price);
      v_line := v_unit_price * v_quantity;
      insert into public.order_items(order_id, product_id, product_name, sku, unit_price, quantity, line_total)
      values(v_order_id, product_row.id, product_row.name, product_row.sku, v_unit_price, v_quantity, v_line);
      update public.products set stock_quantity = stock_quantity - v_quantity, updated_at = now() where id = product_row.id;
    end if;
  end loop;

  insert into public.payments(order_id, method, status) values(v_order_id, p_payment_method, case when p_payment_method = 'bank_transfer' then 'pending_verification'::public.payment_status else 'pending'::public.payment_status end);
  insert into public.order_status_history(order_id, new_status) values(v_order_id, 'placed'::public.order_status);
  return v_order_number;
end;
$$;
