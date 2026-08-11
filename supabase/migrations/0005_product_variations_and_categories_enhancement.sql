-- Migration: 0005_product_variations_and_categories_enhancement.sql
-- Description: Enhances categories hierarchy, adds product attributes/types, and introduces product_variations table.

-- 1. Enhance Categories table
alter table public.categories 
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists icon_path text,
  add column if not exists banner_path text,
  add column if not exists is_published boolean not null default true;

-- 2. Enhance Products table
alter table public.products
  add column if not exists product_type text not null default 'simple' check (product_type in ('simple', 'variable')),
  add column if not exists barcode text,
  add column if not exists cost_price numeric(12,2),
  add column if not exists status text not null default 'published' check (status in ('draft', 'published', 'hidden', 'scheduled')),
  add column if not exists subcategory_id uuid references public.categories(id) on delete set null,
  add column if not exists warehouse_location text,
  add column if not exists track_inventory boolean not null default true,
  add column if not exists sale_start_at timestamptz,
  add column if not exists sale_end_at timestamptz,
  add column if not exists search_keywords text[] not null default '{}',
  add column if not exists featured_image text;

-- 3. Create Product Variations table
create table if not exists public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  barcode text,
  regular_price numeric(12,2) not null check (regular_price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5,
  image_url text,
  attributes jsonb not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Indexes for performance across 10,000+ items
create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists products_subcategory_idx on public.products(subcategory_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_type_idx on public.products(product_type);
create index if not exists product_variations_product_idx on public.product_variations(product_id);
create index if not exists product_variations_sku_idx on public.product_variations(sku);

-- Enable RLS on product_variations
alter table public.product_variations enable row level security;

-- Public read access for active product variations
create policy "public read product variations" on public.product_variations 
  for select using (true);
