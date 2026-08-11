-- Migration: 0007_product_catalog_enhancements.sql
-- Description: Adds global attribute library, category attribute templates, and enhances order variation snapshots.

-- 1. Global Attributes Library (Reusable across products)
create table if not exists public.global_attributes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  display_type text not null default 'button' check (display_type in ('button', 'color', 'image', 'radio')),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_attribute_values (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.global_attributes(id) on delete cascade,
  label text not null,
  slug text not null,
  swatch_color text,
  swatch_image text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(attribute_id, slug)
);

-- 2. Category Attribute Templates (Recommended options per category)
create table if not exists public.category_attribute_templates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  display_type text not null default 'button' check (display_type in ('button', 'color', 'image', 'radio')),
  is_required boolean not null default true,
  sort_order integer not null default 0,
  default_values jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(category_id, slug)
);

-- Indexes for efficient queries
create index if not exists global_attributes_sort_idx on public.global_attributes(sort_order);
create index if not exists global_attribute_values_attr_idx on public.global_attribute_values(attribute_id, sort_order);
create index if not exists category_attribute_templates_cat_idx on public.category_attribute_templates(category_id, sort_order);

-- Enable RLS
alter table public.global_attributes enable row level security;
alter table public.global_attribute_values enable row level security;
alter table public.category_attribute_templates enable row level security;

-- Public Read Policies
drop policy if exists "public global attributes" on public.global_attributes;
create policy "public global attributes" on public.global_attributes
  for select to anon, authenticated using (true);

drop policy if exists "public global attribute values" on public.global_attribute_values;
create policy "public global attribute values" on public.global_attribute_values
  for select to anon, authenticated using (is_active = true);

drop policy if exists "public category attribute templates" on public.category_attribute_templates;
create policy "public category attribute templates" on public.category_attribute_templates
  for select to anon, authenticated using (true);

-- Admin Management Policies
drop policy if exists "admins manage global attributes" on public.global_attributes;
create policy "admins manage global attributes" on public.global_attributes
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "admins manage global attribute values" on public.global_attribute_values;
create policy "admins manage global attribute values" on public.global_attribute_values
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "admins manage category attribute templates" on public.category_attribute_templates;
create policy "admins manage category attribute templates" on public.category_attribute_templates
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 4. Fix RLS policies for product_variations
drop policy if exists "public read product variations" on public.product_variations;
drop policy if exists "public read active product variations" on public.product_variations;
drop policy if exists "anon read active product variations" on public.product_variations;
drop policy if exists "auth read product variations" on public.product_variations;
drop policy if exists "admins manage product variations" on public.product_variations;

create policy "anon read active product variations" on public.product_variations
  for select to anon
  using (status = 'active' and exists (
    select 1 from public.products p where p.id = product_id and p.is_published = true
  ));

create policy "auth read product variations" on public.product_variations
  for select to authenticated
  using (
    (status = 'active' and exists (
      select 1 from public.products p where p.id = product_id and p.is_published = true
    ))
    or (select private.is_admin())
  );

create policy "admins manage product variations" on public.product_variations
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Seed standard Category Attribute Templates if missing
insert into public.global_attributes (name, slug, display_type, description) values
  ('Size', 'size', 'button', 'Standard product dimensions/sizes'),
  ('Color', 'color', 'color', 'Visual color swatches'),
  ('Flavor', 'flavor', 'radio', 'Bakery and edible product flavors'),
  ('Strap Color', 'strap-color', 'color', 'Watch strap colors'),
  ('Dial Color', 'dial-color', 'color', 'Watch dial colors'),
  ('Material', 'material', 'button', 'Construction material')
on conflict (slug) do nothing;

-- 3. Enhance Order Creation RPC Function for Variable Products
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
  v_image_path text;
  v_var_title text;
  v_pay_status public.payment_status;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;

  if p_payment_method::text = 'bank_transfer' then
    v_pay_status := 'pending_verification'::public.payment_status;
  else
    v_pay_status := 'pending'::public.payment_status;
  end if;

  -- Validate availability & calculate subtotal
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
      if product_row.stock_quantity < v_quantity then raise exception 'One or more products are unavailable'; end if;
      v_unit_price := coalesce(product_row.sale_price, product_row.price);
    end if;
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
  end loop;

  -- Free delivery over 3000 PKR
  if v_subtotal < 3000 then v_delivery := 250; end if;

  v_order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  
  insert into public.orders(
    order_number, user_id, customer_name, customer_phone, customer_email, 
    city, area, delivery_address, landmark, delivery_instructions, 
    subtotal, delivery_fee, total, payment_method
  )
  values(
    v_order_number, v_user_id, 
    nullif(trim(p_customer->>'full_name'),''), 
    regexp_replace(trim(p_customer->>'phone'), '\s+', '', 'g'), 
    nullif(trim(p_customer->>'email'),''), 
    trim(p_customer->>'city'), 
    trim(p_customer->>'area'), 
    trim(p_customer->>'address'), 
    nullif(trim(p_customer->>'landmark'),''), 
    nullif(trim(p_customer->>'instructions'),''), 
    v_subtotal, v_delivery, v_subtotal + v_delivery, p_payment_method
  )
  returning id into v_order_id;

  -- Insert order items & reduce stock
  for item in select * from jsonb_array_elements(p_items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid for update;
    v_quantity := (item->>'quantity')::integer;
    v_variation_id := nullif(item->>'variation_id', '')::uuid;
    
    if product_row.product_type = 'variable' then
      select * into variation_row from public.product_variations where id = v_variation_id and product_id = product_row.id and status = 'active' for update;
      v_unit_price := coalesce(variation_row.sale_price, variation_row.regular_price);
      v_line := v_unit_price * v_quantity;
      v_var_title := coalesce(variation_row.title, variation_row.name, product_row.name);
      
      -- Resolve best image path
      v_image_path := coalesce(
        variation_row.image_url, 
        (select storage_path from public.product_variation_images where variation_id = variation_row.id order by is_featured desc, sort_order limit 1),
        product_row.featured_image,
        (select storage_path from public.product_images where product_id = product_row.id order by sort_order limit 1)
      );

      insert into public.order_items(
        order_id, product_id, variation_id, variation_attributes, variation_title, 
        image_path, product_name, sku, unit_price, quantity, line_total
      )
      values(
        v_order_id, product_row.id, variation_row.id, variation_row.attributes, v_var_title, 
        v_image_path, v_var_title, coalesce(variation_row.sku, product_row.sku), v_unit_price, v_quantity, v_line
      );
      
      -- Reduce variation stock
      update public.product_variations 
        set stock_quantity = stock_quantity - v_quantity, updated_at = now() 
        where id = variation_row.id;
      
      -- Recalculate parent product total stock from active variations
      update public.products 
        set stock_quantity = (select coalesce(sum(stock_quantity), 0) from public.product_variations where product_id = product_row.id and status = 'active'), updated_at = now() 
        where id = product_row.id;
    else
      v_unit_price := coalesce(product_row.sale_price, product_row.price);
      v_line := v_unit_price * v_quantity;
      v_image_path := coalesce(
        product_row.featured_image,
        (select storage_path from public.product_images where product_id = product_row.id order by sort_order limit 1)
      );

      insert into public.order_items(
        order_id, product_id, product_name, sku, image_path, unit_price, quantity, line_total
      )
      values(
        v_order_id, product_row.id, product_row.name, product_row.sku, v_image_path, v_unit_price, v_quantity, v_line
      );
      
      update public.products 
        set stock_quantity = stock_quantity - v_quantity, updated_at = now() 
        where id = product_row.id;
    end if;
  end loop;

  insert into public.payments(order_id, method, status) 
  values(v_order_id, p_payment_method, v_pay_status);
  
  insert into public.order_status_history(order_id, new_status) 
  values(v_order_id, 'placed'::public.order_status);
  
  return v_order_number;
end;
$$;
