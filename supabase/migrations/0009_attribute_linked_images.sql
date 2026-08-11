-- Migration: 0009_attribute_linked_images.sql
-- Description: Adds controls_images flag to product_attributes and creates product_attribute_images table for smart gallery mapping.

-- 1. Add controls_images column to product_attributes
alter table public.product_attributes
  add column if not exists controls_images boolean not null default false;

-- Default controls_images to true for color display_type attributes
update public.product_attributes
  set controls_images = true
  where display_type = 'color' or lower(name) like '%color%';

-- 2. Create product_attribute_images junction table
create table if not exists public.product_attribute_images (
  id uuid primary key default gen_random_uuid(),
  attribute_value_id uuid not null references public.product_attribute_values(id) on delete cascade,
  product_image_id uuid references public.product_images(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (attribute_value_id, storage_path)
);

-- Indexes for fast gallery lookup
create index if not exists product_attribute_images_value_sort_idx 
  on public.product_attribute_images(attribute_value_id, sort_order);

-- 3. Enable RLS and add policies
alter table public.product_attribute_images enable row level security;

drop policy if exists "public product attribute images" on public.product_attribute_images;
create policy "public product attribute images" on public.product_attribute_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.product_attribute_values v
    join public.product_attributes a on a.id = v.attribute_id
    join public.products p on p.id = a.product_id
    where v.id = attribute_value_id and (p.is_published or (select private.is_admin()))
  ));

drop policy if exists "admins manage product attribute images" on public.product_attribute_images;
create policy "admins manage product attribute images" on public.product_attribute_images
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
