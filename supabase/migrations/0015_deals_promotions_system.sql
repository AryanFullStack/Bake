-- Migration: 0015_deals_promotions_system.sql
-- Description: Complete Deals & Promotions schema with multi-product/variation support, priorities, scheduling & order snapshots.

-- 1. Create Deals Table
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  short_description text,
  deal_type text not null check (deal_type in ('percentage', 'fixed', 'sale_price', 'buy_x_get_y')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  banner_image text,
  mobile_banner_image text,
  badge_text text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  priority integer not null default 1 check (priority >= 1),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  max_quantity_per_customer integer check (max_quantity_per_customer is null or max_quantity_per_customer > 0),
  total_quantity integer check (total_quantity is null or total_quantity >= 0),
  min_quantity integer check (min_quantity is null or min_quantity > 0),
  min_cart_amount numeric(12,2) check (min_cart_amount is null or min_cart_amount >= 0),
  max_discount_amount numeric(12,2) check (max_discount_amount is null or max_discount_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

-- 2. Create Deal Products Table
create table if not exists public.deal_products (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variation_id uuid references public.product_variations(id) on delete cascade,
  custom_deal_price numeric(12,2) check (custom_deal_price is null or custom_deal_price >= 0),
  created_at timestamptz not null default now()
);

-- 3. Enhance Order Items Table for Deal Audit Snapshots
alter table public.order_items
  add column if not exists deal_id uuid references public.deals(id) on delete set null,
  add column if not exists deal_name text,
  add column if not exists regular_price numeric(12,2),
  add column if not exists discount_amount numeric(12,2);

-- 4. Create Indexes
create index if not exists deals_slug_idx on public.deals(slug);
create index if not exists deals_active_dates_idx on public.deals(is_active, start_at, end_at);
create index if not exists deals_priority_idx on public.deals(priority);
create index if not exists deals_featured_idx on public.deals(is_featured);
create index if not exists deal_products_deal_idx on public.deal_products(deal_id);
create index if not exists deal_products_product_idx on public.deal_products(product_id);
create index if not exists deal_products_variation_idx on public.deal_products(variation_id);
create index if not exists order_items_deal_idx on public.order_items(deal_id);

-- 5. Enable RLS
alter table public.deals enable row level security;
alter table public.deal_products enable row level security;

-- 6. Policies for public access (Storefront read access)
drop policy if exists "public read deals" on public.deals;
create policy "public read deals" on public.deals for select using (true);

drop policy if exists "public read deal_products" on public.deal_products;
create policy "public read deal_products" on public.deal_products for select using (true);

-- 7. Policies for admin write access
drop policy if exists "admin all deals" on public.deals;
create policy "admin all deals" on public.deals for all using (
  (select private.is_admin()) = true
) with check (
  (select private.is_admin()) = true
);

drop policy if exists "admin all deal_products" on public.deal_products;
create policy "admin all deal_products" on public.deal_products for all using (
  (select private.is_admin()) = true
) with check (
  (select private.is_admin()) = true
);

-- 8. Grant access to anon and authenticated roles for Data API
grant select on public.deals to anon, authenticated;
grant select on public.deal_products to anon, authenticated;
grant all on public.deals to authenticated;
grant all on public.deal_products to authenticated;
