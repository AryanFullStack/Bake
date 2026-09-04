-- ============================================================================
-- Bake Mart Bazaar - Consolidated Master Database Schema
-- File: supabase/master_schema.sql
-- Description: Complete unified PostgreSQL DDL & essential seed dataset for Supabase.
--              Includes all custom types, schemas, tables, functions, triggers,
--              indexes, RLS security policies, storage buckets, and core settings.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & SCHEMAS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create schema if not exists private;

-- ----------------------------------------------------------------------------
-- 2. CUSTOM ENUM TYPES
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin', 'manager', 'fulfilment');
exception when duplicate_object then null; end $$;
alter type public.user_role add value if not exists 'customer';
alter type public.user_role add value if not exists 'admin';
alter type public.user_role add value if not exists 'manager';
alter type public.user_role add value if not exists 'fulfilment';

do $$ begin
  create type public.payment_method as enum ('cod', 'bank_transfer');
exception when duplicate_object then null; end $$;
alter type public.payment_method add value if not exists 'cod';
alter type public.payment_method add value if not exists 'bank_transfer';

do $$ begin
  create type public.payment_status as enum ('pending', 'pending_verification', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;
alter type public.payment_status add value if not exists 'pending';
alter type public.payment_status add value if not exists 'pending_verification';
alter type public.payment_status add value if not exists 'paid';
alter type public.payment_status add value if not exists 'failed';
alter type public.payment_status add value if not exists 'refunded';

do $$ begin
  create type public.order_status as enum ('placed', 'confirmed', 'processing', 'baking', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'returned');
exception when duplicate_object then null; end $$;
alter type public.order_status add value if not exists 'placed';
alter type public.order_status add value if not exists 'confirmed';
alter type public.order_status add value if not exists 'processing';
alter type public.order_status add value if not exists 'baking';
alter type public.order_status add value if not exists 'ready';
alter type public.order_status add value if not exists 'out_for_delivery';
alter type public.order_status add value if not exists 'delivered';
alter type public.order_status add value if not exists 'cancelled';
alter type public.order_status add value if not exists 'returned';

do $$ begin
  create type public.custom_cake_status as enum ('submitted', 'under_review', 'quotation_prepared', 'confirmation_required', 'confirmed', 'deposit_pending', 'in_production', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected');
exception when duplicate_object then null; end $$;
alter type public.custom_cake_status add value if not exists 'submitted';
alter type public.custom_cake_status add value if not exists 'under_review';
alter type public.custom_cake_status add value if not exists 'quotation_prepared';
alter type public.custom_cake_status add value if not exists 'confirmation_required';
alter type public.custom_cake_status add value if not exists 'confirmed';
alter type public.custom_cake_status add value if not exists 'deposit_pending';
alter type public.custom_cake_status add value if not exists 'in_production';
alter type public.custom_cake_status add value if not exists 'ready';
alter type public.custom_cake_status add value if not exists 'out_for_delivery';
alter type public.custom_cake_status add value if not exists 'delivered';
alter type public.custom_cake_status add value if not exists 'completed';
alter type public.custom_cake_status add value if not exists 'cancelled';
alter type public.custom_cake_status add value if not exists 'rejected';

-- ----------------------------------------------------------------------------
-- 3. SEQUENCES
-- ----------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 10482;
create sequence if not exists public.custom_cake_request_seq start 1000;

-- ----------------------------------------------------------------------------
-- 4. CORE TABLES DEFINITION
-- ----------------------------------------------------------------------------

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  image_path text,
  icon_path text,
  banner_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- BRANDS
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  subcategory_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id),
  sku text unique not null,
  slug text unique not null,
  name text not null,
  short_description text,
  description text,
  product_type text not null default 'simple' check (product_type in ('simple', 'variable')),
  barcode text,
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  track_inventory boolean not null default true,
  status text not null default 'published' check (status in ('draft', 'published', 'hidden', 'scheduled')),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  featured_image text,
  seo_title text,
  seo_description text,
  tags text[] not null default '{}',
  search_keywords text[] not null default '{}',
  specifications jsonb not null default '{}',
  ingredients text,
  care_instructions text,
  delivery_information text,
  return_policy text,
  warehouse_location text,
  sale_start_at timestamptz,
  sale_end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRODUCT IMAGES
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- PRODUCT ATTRIBUTES
create table if not exists public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  slug text not null,
  display_type text not null default 'button' check (display_type in ('button', 'color', 'image')),
  controls_images boolean not null default false,
  sort_order integer not null default 0,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, slug)
);

-- PRODUCT ATTRIBUTE VALUES
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

-- PRODUCT ATTRIBUTE IMAGES
create table if not exists public.product_attribute_images (
  id uuid primary key default gen_random_uuid(),
  attribute_value_id uuid not null references public.product_attribute_values(id) on delete cascade,
  product_image_id uuid references public.product_images(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (attribute_value_id, storage_path)
);

-- PRODUCT VARIATIONS
create table if not exists public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  title text,
  sku text,
  barcode text,
  description text,
  regular_price numeric(12,2) not null check (regular_price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5,
  image_url text,
  attributes jsonb not null default '{}',
  specifications jsonb not null default '{}',
  dimensions jsonb not null default '{}',
  weight numeric(12,3),
  combination_key text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRODUCT VARIATION IMAGES
create table if not exists public.product_variation_images (
  id uuid primary key default gen_random_uuid(),
  variation_id uuid not null references public.product_variations(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- PRODUCT FAQS
create table if not exists public.product_faqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- PRODUCT RELATIONS
create table if not exists public.product_relations (
  source_product_id uuid not null references public.products(id) on delete cascade,
  target_product_id uuid not null references public.products(id) on delete cascade,
  relation_type text not null check (relation_type in ('related', 'frequently_bought')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key(source_product_id, target_product_id, relation_type),
  check (source_product_id <> target_product_id)
);

-- GLOBAL ATTRIBUTES
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

-- GLOBAL ATTRIBUTE VALUES
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

-- CATEGORY ATTRIBUTE TEMPLATES
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

-- INVENTORY
create table if not exists public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

-- CARTS & CART ITEMS
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variation_id uuid references public.product_variations(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unique(cart_id, product_id, variation_id)
);

-- COURIERS
create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  website_url text,
  tracking_url_template text,
  phone text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ADDRESSES
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  city text not null,
  area text not null,
  address text not null,
  landmark text,
  instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  city text not null,
  area text not null,
  delivery_address text not null,
  landmark text,
  delivery_instructions text,
  preferred_delivery_at timestamptz,
  subtotal numeric(12,2) not null,
  delivery_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  payment_method public.payment_method not null,
  status public.order_status not null default 'placed',
  courier_id uuid references public.couriers(id) on delete set null,
  courier_name text,
  tracking_number text,
  tracking_url text,
  dispatched_at timestamptz,
  expected_delivery_at timestamptz,
  delivery_notes text,
  admin_notes text,
  created_at timestamptz not null default now()
);

-- DEALS & PROMOTIONS
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

create table if not exists public.deal_products (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variation_id uuid references public.product_variations(id) on delete cascade,
  custom_deal_price numeric(12,2) check (custom_deal_price is null or custom_deal_price >= 0),
  created_at timestamptz not null default now()
);

-- ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  variation_id uuid references public.product_variations(id) on delete set null,
  variation_attributes jsonb not null default '{}',
  variation_title text,
  image_path text,
  product_name text not null,
  sku text,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null,
  deal_id uuid references public.deals(id) on delete set null,
  deal_name text,
  regular_price numeric(12,2),
  discount_amount numeric(12,2)
);

-- PAYMENTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  receipt_path text,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  note text,
  transaction_reference text,
  payment_notes text,
  created_at timestamptz not null default now()
);

-- ORDER STATUS HISTORY
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status public.order_status,
  new_status public.order_status not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- WISHLISTS
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(wishlist_id, product_id)
);

-- RECENTLY VIEWED
create table if not exists public.recently_viewed (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(user_id, product_id)
);

-- REVIEWS
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  is_approved boolean not null default false,
  guest_name text,
  guest_email text,
  guest_phone text,
  reviewer_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  admin_note text,
  is_verified_purchase boolean not null default true,
  is_reported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CUSTOM CAKES
create table if not exists public.custom_cake_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  area text not null,
  delivery_address text not null,
  landmark text,
  delivery_instructions text,
  preferred_delivery_at timestamptz,
  cake_type text not null,
  cake_size text not null,
  flavor text not null,
  quantity integer not null default 1,
  theme text,
  cake_message text,
  budget numeric(12,2),
  special_instructions text,
  status public.custom_cake_status not null default 'submitted',
  linked_order_id uuid references public.orders(id),
  created_at timestamptz not null default now()
);

create table if not exists public.custom_cake_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_cake_requests(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_cake_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null references public.custom_cake_requests(id) on delete cascade,
  amount numeric(12,2) not null,
  deposit_amount numeric(12,2),
  delivery_fee numeric(12,2) not null default 0,
  estimated_ready_at timestamptz,
  expires_at timestamptz,
  note text,
  status text not null default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.custom_cake_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_cake_requests(id) on delete cascade,
  old_status public.custom_cake_status,
  new_status public.custom_cake_status not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- CONTENT & ADMIN LOGS
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_path text,
  cta_label text,
  cta_href text,
  is_active boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default false
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  custom_request_id uuid references public.custom_cake_requests(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- MEDIA LIBRARY
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  original_filename text,
  storage_path text not null unique,
  public_url text not null,
  mime_type text not null default 'image/webp',
  extension text not null default 'webp',
  file_size bigint not null default 0,
  width integer,
  height integer,
  alt_text text,
  title text,
  folder text not null default 'products',
  media_type text not null default 'product',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4.1 IDEMPOTENCY COLUMN GUARDS FOR PRE-EXISTING SCHEMAS
-- ----------------------------------------------------------------------------
-- Profiles
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role public.user_role not null default 'customer';

-- Categories
alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete set null;
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists image_path text;
alter table public.categories add column if not exists icon_path text;
alter table public.categories add column if not exists banner_path text;
alter table public.categories add column if not exists sort_order integer not null default 0;
alter table public.categories add column if not exists is_active boolean not null default true;
alter table public.categories add column if not exists is_published boolean not null default true;

-- Products
alter table public.products add column if not exists category_id uuid references public.categories(id);
alter table public.products add column if not exists subcategory_id uuid references public.categories(id) on delete set null;
alter table public.products add column if not exists brand_id uuid references public.brands(id);
alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists product_type text not null default 'simple';
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists price numeric(12,2) not null default 0;
alter table public.products add column if not exists sale_price numeric(12,2);
alter table public.products add column if not exists cost_price numeric(12,2);
alter table public.products add column if not exists stock_quantity integer not null default 0;
alter table public.products add column if not exists low_stock_threshold integer not null default 5;
alter table public.products add column if not exists track_inventory boolean not null default true;
alter table public.products add column if not exists status text not null default 'published';
alter table public.products add column if not exists is_published boolean not null default false;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists is_bestseller boolean not null default false;
alter table public.products add column if not exists featured_image text;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists search_keywords text[] not null default '{}';
alter table public.products add column if not exists specifications jsonb not null default '{}';
alter table public.products add column if not exists ingredients text;
alter table public.products add column if not exists care_instructions text;
alter table public.products add column if not exists delivery_information text;
alter table public.products add column if not exists return_policy text;
alter table public.products add column if not exists warehouse_location text;
alter table public.products add column if not exists sale_start_at timestamptz;
alter table public.products add column if not exists sale_end_at timestamptz;

-- Product Images
alter table public.product_images add column if not exists alt_text text;
alter table public.product_images add column if not exists sort_order integer not null default 0;

-- Product Attributes & Values & Images
alter table public.product_attributes add column if not exists display_type text not null default 'button';
alter table public.product_attributes add column if not exists controls_images boolean not null default false;
alter table public.product_attributes add column if not exists sort_order integer not null default 0;
alter table public.product_attributes add column if not exists is_required boolean not null default true;

alter table public.product_attribute_values add column if not exists sort_order integer not null default 0;
alter table public.product_attribute_values add column if not exists swatch_color text;
alter table public.product_attribute_values add column if not exists swatch_image text;
alter table public.product_attribute_values add column if not exists is_active boolean not null default true;

alter table public.product_attribute_images add column if not exists sort_order integer not null default 0;

-- Product Variations & Images
alter table public.product_variations add column if not exists title text;
alter table public.product_variations add column if not exists sku text;
alter table public.product_variations add column if not exists barcode text;
alter table public.product_variations add column if not exists description text;
alter table public.product_variations add column if not exists regular_price numeric(12,2) not null default 0;
alter table public.product_variations add column if not exists sale_price numeric(12,2);
alter table public.product_variations add column if not exists cost_price numeric(12,2);
alter table public.product_variations add column if not exists stock_quantity integer not null default 0;
alter table public.product_variations add column if not exists low_stock_threshold integer not null default 5;
alter table public.product_variations add column if not exists image_url text;
alter table public.product_variations add column if not exists attributes jsonb not null default '{}';
alter table public.product_variations add column if not exists specifications jsonb not null default '{}';
alter table public.product_variations add column if not exists dimensions jsonb not null default '{}';
alter table public.product_variations add column if not exists weight numeric(12,3);
alter table public.product_variations add column if not exists combination_key text;
alter table public.product_variations add column if not exists status text not null default 'active';

alter table public.product_variation_images add column if not exists alt_text text;
alter table public.product_variation_images add column if not exists sort_order integer not null default 0;
alter table public.product_variation_images add column if not exists is_featured boolean not null default false;

-- Product FAQs & FAQs
alter table public.product_faqs add column if not exists sort_order integer not null default 0;
alter table public.product_faqs add column if not exists is_published boolean not null default true;
alter table public.faqs add column if not exists sort_order integer not null default 0;
alter table public.faqs add column if not exists is_published boolean not null default false;

-- Product Relations
alter table public.product_relations add column if not exists sort_order integer not null default 0;

-- Global Attributes & Values & Templates
alter table public.global_attributes add column if not exists display_type text not null default 'button';
alter table public.global_attributes add column if not exists description text;
alter table public.global_attributes add column if not exists sort_order integer not null default 0;

alter table public.global_attribute_values add column if not exists swatch_color text;
alter table public.global_attribute_values add column if not exists swatch_image text;
alter table public.global_attribute_values add column if not exists sort_order integer not null default 0;
alter table public.global_attribute_values add column if not exists is_active boolean not null default true;

alter table public.category_attribute_templates add column if not exists display_type text not null default 'button';
alter table public.category_attribute_templates add column if not exists is_required boolean not null default true;
alter table public.category_attribute_templates add column if not exists sort_order integer not null default 0;
alter table public.category_attribute_templates add column if not exists default_values jsonb not null default '[]'::jsonb;

-- Inventory
alter table public.inventory add column if not exists quantity integer not null default 0;
alter table public.inventory add column if not exists reserved_quantity integer not null default 0;
alter table public.inventory add column if not exists low_stock_threshold integer not null default 5;

-- Couriers
alter table public.couriers add column if not exists website_url text;
alter table public.couriers add column if not exists tracking_url_template text;
alter table public.couriers add column if not exists phone text;
alter table public.couriers add column if not exists is_active boolean not null default true;
alter table public.couriers add column if not exists sort_order integer not null default 0;

-- Addresses
alter table public.addresses add column if not exists label text not null default 'Home';
alter table public.addresses add column if not exists landmark text;
alter table public.addresses add column if not exists instructions text;
alter table public.addresses add column if not exists is_default boolean not null default false;

-- Orders
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists city text;
alter table public.orders add column if not exists area text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists landmark text;
alter table public.orders add column if not exists delivery_instructions text;
alter table public.orders add column if not exists preferred_delivery_at timestamptz;
alter table public.orders add column if not exists subtotal numeric(12,2) not null default 0;
alter table public.orders add column if not exists delivery_fee numeric(12,2) not null default 0;
alter table public.orders add column if not exists discount numeric(12,2) not null default 0;
alter table public.orders add column if not exists total numeric(12,2) not null default 0;
alter table public.orders add column if not exists payment_method public.payment_method not null default 'cod'::public.payment_method;
alter table public.orders add column if not exists status public.order_status not null default 'placed'::public.order_status;
alter table public.orders add column if not exists courier_id uuid references public.couriers(id) on delete set null;
alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists dispatched_at timestamptz;
alter table public.orders add column if not exists expected_delivery_at timestamptz;
alter table public.orders add column if not exists delivery_notes text;
alter table public.orders add column if not exists admin_notes text;

-- Order Items
alter table public.order_items add column if not exists order_id uuid references public.orders(id) on delete cascade;
alter table public.order_items add column if not exists product_id uuid references public.products(id);
alter table public.order_items add column if not exists variation_id uuid references public.product_variations(id) on delete set null;
alter table public.order_items add column if not exists variation_attributes jsonb not null default '{}';
alter table public.order_items add column if not exists variation_title text;
alter table public.order_items add column if not exists image_path text;
alter table public.order_items add column if not exists product_name text;
alter table public.order_items add column if not exists sku text;
alter table public.order_items add column if not exists unit_price numeric(12,2) not null default 0;
alter table public.order_items add column if not exists quantity integer not null default 1;
alter table public.order_items add column if not exists line_total numeric(12,2) not null default 0;
alter table public.order_items add column if not exists deal_id uuid references public.deals(id) on delete set null;
alter table public.order_items add column if not exists deal_name text;
alter table public.order_items add column if not exists regular_price numeric(12,2);
alter table public.order_items add column if not exists discount_amount numeric(12,2);

-- Payments
alter table public.payments add column if not exists order_id uuid references public.orders(id) on delete cascade;
alter table public.payments add column if not exists method public.payment_method not null default 'cod'::public.payment_method;
alter table public.payments add column if not exists status public.payment_status not null default 'pending'::public.payment_status;
alter table public.payments add column if not exists receipt_path text;
alter table public.payments add column if not exists verified_by uuid references auth.users(id);
alter table public.payments add column if not exists verified_at timestamptz;
alter table public.payments add column if not exists note text;
alter table public.payments add column if not exists transaction_reference text;
alter table public.payments add column if not exists payment_notes text;

-- Reviews
alter table public.reviews add column if not exists product_id uuid references public.products(id) on delete cascade;
alter table public.reviews add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.reviews add column if not exists order_id uuid references public.orders(id) on delete cascade;
alter table public.reviews add column if not exists rating integer;
alter table public.reviews add column if not exists body text;
alter table public.reviews add column if not exists is_approved boolean not null default false;
alter table public.reviews add column if not exists guest_name text;
alter table public.reviews add column if not exists guest_email text;
alter table public.reviews add column if not exists guest_phone text;
alter table public.reviews add column if not exists reviewer_name text;
alter table public.reviews add column if not exists status text not null default 'pending';
alter table public.reviews add column if not exists admin_note text;
alter table public.reviews add column if not exists is_verified_purchase boolean not null default true;
alter table public.reviews add column if not exists is_reported boolean not null default false;

-- Custom Cake Requests
alter table public.custom_cake_requests add column if not exists request_number text;
alter table public.custom_cake_requests add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.custom_cake_requests add column if not exists customer_name text;
alter table public.custom_cake_requests add column if not exists phone text;
alter table public.custom_cake_requests add column if not exists email text;
alter table public.custom_cake_requests add column if not exists city text;
alter table public.custom_cake_requests add column if not exists area text;
alter table public.custom_cake_requests add column if not exists delivery_address text;
alter table public.custom_cake_requests add column if not exists landmark text;
alter table public.custom_cake_requests add column if not exists delivery_instructions text;
alter table public.custom_cake_requests add column if not exists preferred_delivery_at timestamptz;
alter table public.custom_cake_requests add column if not exists cake_type text;
alter table public.custom_cake_requests add column if not exists cake_size text;
alter table public.custom_cake_requests add column if not exists flavor text;
alter table public.custom_cake_requests add column if not exists quantity integer not null default 1;
alter table public.custom_cake_requests add column if not exists theme text;
alter table public.custom_cake_requests add column if not exists cake_message text;
alter table public.custom_cake_requests add column if not exists budget numeric(12,2);
alter table public.custom_cake_requests add column if not exists special_instructions text;
alter table public.custom_cake_requests add column if not exists status public.custom_cake_status not null default 'submitted'::public.custom_cake_status;
alter table public.custom_cake_requests add column if not exists linked_order_id uuid references public.orders(id);

-- Banners
alter table public.banners add column if not exists body text;
alter table public.banners add column if not exists image_path text;
alter table public.banners add column if not exists cta_label text;
alter table public.banners add column if not exists cta_href text;
alter table public.banners add column if not exists is_active boolean not null default false;
alter table public.banners add column if not exists sort_order integer not null default 0;

-- Media
alter table public.media add column if not exists original_filename text;
alter table public.media add column if not exists width integer;
alter table public.media add column if not exists height integer;
alter table public.media add column if not exists alt_text text;
alter table public.media add column if not exists title text;
alter table public.media add column if not exists folder text not null default 'products';
alter table public.media add column if not exists media_type text not null default 'product';

-- ----------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
create index if not exists products_search_idx on public.products using gin ((to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))));
create index if not exists products_tags_idx on public.products using gin(tags);
create index if not exists products_category_idx on public.products(category_id, is_published);
create index if not exists products_created_at_idx on public.products(created_at desc, id desc);
create index if not exists products_bestseller_idx on public.products(is_bestseller, is_published, created_at desc);
create index if not exists products_featured_idx on public.products(is_featured, is_published, created_at desc);
create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists products_subcategory_idx on public.products(subcategory_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_type_idx on public.products(product_type);

create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index if not exists product_variations_product_idx on public.product_variations(product_id);
create index if not exists product_variations_sku_idx on public.product_variations(sku);
create unique index if not exists product_variations_combination_key_idx on public.product_variations(product_id, combination_key) where combination_key is not null;
create unique index if not exists product_variation_featured_image_idx on public.product_variation_images(variation_id) where is_featured;
create index if not exists product_variation_images_sort_idx on public.product_variation_images(variation_id, sort_order);
create index if not exists product_attribute_images_value_sort_idx on public.product_attribute_images(attribute_value_id, sort_order);

create index if not exists inventory_low_stock_idx on public.inventory(quantity, low_stock_threshold);
create index if not exists addresses_user_default_idx on public.addresses(user_id, is_default);

create index if not exists orders_tracking_idx on public.orders(order_number, customer_phone);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists orders_courier_idx on public.orders(courier_id);
create index if not exists orders_tracking_num_idx on public.orders(tracking_number);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists orders_created_at_desc_idx on public.orders(created_at desc);

create index if not exists order_items_product_idx on public.order_items(product_id);
create index if not exists order_items_variation_idx on public.order_items(variation_id);
create index if not exists order_items_deal_idx on public.order_items(deal_id);
create index if not exists order_history_idx on public.order_status_history(order_id, created_at);

create index if not exists custom_tracking_idx on public.custom_cake_requests(request_number, phone);
create index if not exists custom_cakes_status_created_idx on public.custom_cake_requests(status, created_at desc);
create index if not exists custom_cakes_user_idx on public.custom_cake_requests(user_id, created_at desc);

create UNIQUE index if not exists reviews_order_product_idx on public.reviews(order_id, product_id);
create index if not exists reviews_status_created_idx on public.reviews(status, created_at desc);
create index if not exists reviews_product_status_idx on public.reviews(product_id, status, created_at desc);
create index if not exists reviews_order_id_idx on public.reviews(order_id);

create index if not exists global_attributes_sort_idx on public.global_attributes(sort_order);
create index if not exists global_attribute_values_attr_idx on public.global_attribute_values(attribute_id, sort_order);
create index if not exists category_attribute_templates_cat_idx on public.category_attribute_templates(category_id, sort_order);

create index if not exists deals_slug_idx on public.deals(slug);
create index if not exists deals_active_dates_idx on public.deals(is_active, start_at, end_at);
create index if not exists deals_priority_idx on public.deals(priority);
create index if not exists deals_featured_idx on public.deals(is_featured);
create index if not exists deal_products_deal_idx on public.deal_products(deal_id);
create index if not exists deal_products_product_idx on public.deal_products(product_id);
create index if not exists deal_products_variation_idx on public.deal_products(variation_id);

create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists admin_logs_created_idx on public.admin_activity_logs(created_at desc);

create index if not exists media_folder_idx on public.media(folder);
create index if not exists media_type_idx on public.media(media_type);
create index if not exists media_created_at_idx on public.media(created_at desc);
create index if not exists media_search_trgm_idx on public.media using gin ((coalesce(filename,'') || ' ' || coalesce(title,'') || ' ' || coalesce(alt_text,'') || ' ' || coalesce(original_filename,'')) gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- 6. SECURITY HELPERS, PROCEDURES & TRIGGERS
-- ----------------------------------------------------------------------------

-- IS_ADMIN HELPER
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles 
    where id = (select auth.uid()) and role in ('admin', 'manager', 'fulfilment')
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

-- AUTO PROFILE ON SIGNUP TRIGGER
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- INVENTORY SYNC TRIGGER
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
create trigger products_sync_inventory
  after insert or update of stock_quantity, low_stock_threshold on public.products
  for each row execute function public.sync_inventory_from_product();

-- SINGLE DEFAULT ADDRESS TRIGGER
create or replace function public.handle_default_address()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.is_default = true then
    update public.addresses
    set is_default = false
    where user_id = NEW.user_id and id <> NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_default_address_change on public.addresses;
create trigger on_default_address_change
  before insert or update of is_default on public.addresses
  for each row
  when (NEW.is_default = true)
  execute function public.handle_default_address();

-- MEDIA UPDATED_AT TRIGGER
create or replace function public.media_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_updated_at_trigger on public.media;
create trigger media_updated_at_trigger
  before update on public.media
  for each row execute function public.media_set_updated_at();

-- ATOMIC GUEST CHECKOUT RPC
create or replace function public.create_guest_order(
  p_customer jsonb, 
  p_payment_method text, 
  p_items jsonb
)
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
  v_sku text;
  v_attributes jsonb;
  v_pay_method public.payment_method;
  v_pay_status public.payment_status;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;

  begin
    v_pay_method := p_payment_method::public.payment_method;
  exception when others then
    v_pay_method := 'cod'::public.payment_method;
  end;

  if v_pay_method = 'bank_transfer'::public.payment_method then
    v_pay_status := 'pending_verification'::public.payment_status;
  else
    v_pay_status := 'pending'::public.payment_status;
  end if;

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

  if v_subtotal < 3000 then v_delivery := 250; end if;

  v_order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  
  insert into public.orders(
    order_number, user_id, customer_name, customer_phone, customer_email, 
    city, area, delivery_address, landmark, delivery_instructions, 
    subtotal, delivery_fee, total, payment_method, status
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
    v_subtotal, v_delivery, v_subtotal + v_delivery, v_pay_method, 'placed'::public.order_status
  )
  returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid for update;
    v_quantity := (item->>'quantity')::integer;
    v_variation_id := nullif(item->>'variation_id', '')::uuid;
    
    if product_row.product_type = 'variable' then
      select * into variation_row from public.product_variations where id = v_variation_id and product_id = product_row.id and status = 'active' for update;
      v_unit_price := coalesce(variation_row.sale_price, variation_row.regular_price);
      v_line := v_unit_price * v_quantity;
      v_var_title := coalesce(variation_row.title, variation_row.name, product_row.name);
      v_sku := coalesce(variation_row.sku, product_row.sku);
      v_attributes := variation_row.attributes;
      
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
        v_order_id, product_row.id, variation_row.id, v_attributes, v_var_title, 
        v_image_path, product_row.name, v_sku, v_unit_price, v_quantity, v_line
      );
      
      update public.product_variations 
        set stock_quantity = stock_quantity - v_quantity, updated_at = now() 
        where id = variation_row.id;
      
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
  values(v_order_id, v_pay_method, v_pay_status);
  
  insert into public.order_status_history(order_id, new_status) 
  values(v_order_id, 'placed'::public.order_status);
  
  return v_order_number;
end;
$$;

create or replace function public.create_guest_order(
  p_customer jsonb, 
  p_payment_method public.payment_method, 
  p_items jsonb
)
returns text language plpgsql security definer set search_path = public
as $$
begin
  return public.create_guest_order(p_customer, p_payment_method::text, p_items);
end;
$$;

grant execute on function public.create_guest_order(jsonb, text, jsonb) to anon, authenticated;
grant execute on function public.create_guest_order(jsonb, public.payment_method, jsonb) to anon, authenticated;

-- ATOMIC ADMIN ORDER CREATION RPC
create or replace function public.create_admin_order(
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text,
  p_payment_status text,
  p_discount numeric default 0,
  p_delivery_fee numeric default 0,
  p_courier_id uuid default null,
  p_tracking_number text default null,
  p_admin_notes text default null,
  p_created_by uuid default auth.uid()
)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_variation public.product_variations%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_unit_price numeric;
  v_line_total numeric;
  v_quantity integer;
  v_var_id uuid;
  v_var_title text;
  v_sku text;
  v_attributes jsonb;
  v_image_path text;
  v_courier_name text := null;
  v_pay_method public.payment_method;
  v_pay_status public.payment_status;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Order items cannot be empty'; end if;

  begin v_pay_method := p_payment_method::public.payment_method; exception when others then v_pay_method := 'cod'::public.payment_method; end;
  begin v_pay_status := p_payment_status::public.payment_status; exception when others then v_pay_status := 'pending'::public.payment_status; end;

  if p_courier_id is not null then
    select name into v_courier_name from public.couriers where id = p_courier_id;
  end if;

  v_order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 then raise exception 'Invalid item quantity'; end if;
    
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    if v_product.id is null then raise exception 'Product not found'; end if;

    if v_item->>'unit_price' is not null then
      v_unit_price := (v_item->>'unit_price')::numeric;
    elsif v_product.product_type = 'variable' and (v_item->>'variation_id') is not null then
      select * into v_variation from public.product_variations where id = (v_item->>'variation_id')::uuid;
      v_unit_price := coalesce(v_variation.sale_price, v_variation.regular_price);
    else
      v_unit_price := coalesce(v_product.sale_price, v_product.price);
    end if;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  insert into public.orders (
    order_number, user_id, customer_name, customer_phone, customer_email,
    city, area, delivery_address, landmark, delivery_instructions,
    subtotal, delivery_fee, discount, total, payment_method, status,
    courier_id, courier_name, tracking_number, admin_notes
  )
  values (
    v_order_number,
    nullif(p_customer->>'user_id', '')::uuid,
    trim(p_customer->>'full_name'),
    regexp_replace(trim(p_customer->>'phone'), '\s+', '', 'g'),
    nullif(trim(p_customer->>'email'), ''),
    trim(p_customer->>'city'),
    trim(p_customer->>'area'),
    trim(p_customer->>'address'),
    nullif(trim(p_customer->>'landmark'), ''),
    nullif(trim(p_customer->>'instructions'), ''),
    v_subtotal,
    coalesce(p_delivery_fee, 0),
    coalesce(p_discount, 0),
    greatest(0, v_subtotal + coalesce(p_delivery_fee, 0) - coalesce(p_discount, 0)),
    v_pay_method,
    'placed'::public.order_status,
    p_courier_id,
    v_courier_name,
    p_tracking_number,
    p_admin_notes
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    v_quantity := (v_item->>'quantity')::integer;
    v_var_id := nullif(v_item->>'variation_id', '')::uuid;

    if v_product.product_type = 'variable' and v_var_id is not null then
      select * into v_variation from public.product_variations where id = v_var_id for update;
      v_unit_price := coalesce((v_item->>'unit_price')::numeric, v_variation.sale_price, v_variation.regular_price);
      v_line_total := v_unit_price * v_quantity;
      v_var_title := coalesce(v_variation.title, v_variation.name, v_product.name);
      v_sku := coalesce(v_variation.sku, v_product.sku);
      v_attributes := v_variation.attributes;
      v_image_path := coalesce(v_variation.image_url, v_product.featured_image);

      insert into public.order_items (
        order_id, product_id, variation_id, variation_attributes, variation_title,
        image_path, product_name, sku, unit_price, quantity, line_total
      )
      values (
        v_order_id, v_product.id, v_variation.id, v_attributes, v_var_title,
        v_image_path, v_product.name, v_sku, v_unit_price, v_quantity, v_line_total
      );

      update public.product_variations set stock_quantity = greatest(0, stock_quantity - v_quantity), updated_at = now() where id = v_variation.id;
      update public.products set stock_quantity = (select coalesce(sum(stock_quantity),0) from public.product_variations where product_id = v_product.id and status = 'active') where id = v_product.id;
    else
      v_unit_price := coalesce((v_item->>'unit_price')::numeric, v_product.sale_price, v_product.price);
      v_line_total := v_unit_price * v_quantity;
      v_image_path := v_product.featured_image;

      insert into public.order_items (
        order_id, product_id, product_name, sku, image_path, unit_price, quantity, line_total
      )
      values (
        v_order_id, v_product.id, v_product.name, v_product.sku, v_image_path, v_unit_price, v_quantity, v_line_total
      );

      update public.products set stock_quantity = greatest(0, stock_quantity - v_quantity), updated_at = now() where id = v_product.id;
    end if;
  end loop;

  insert into public.payments (order_id, method, status, verified_by, verified_at)
  values (
    v_order_id, v_pay_method, v_pay_status,
    case when v_pay_status = 'paid' then p_created_by else null end,
    case when v_pay_status = 'paid' then now() else null end
  );

  insert into public.order_status_history (order_id, new_status, note, changed_by)
  values (v_order_id, 'placed'::public.order_status, 'Manual order created by staff', p_created_by);

  return v_order_number;
end;
$$;

grant execute on function public.create_admin_order to authenticated;

-- ATOMIC CUSTOM CAKE CONVERSION RPC
create or replace function public.convert_custom_cake_to_order(
  p_request_id uuid,
  p_admin_id uuid default auth.uid()
)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_request public.custom_cake_requests%rowtype;
  v_quote public.custom_cake_quotes%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_total numeric;
  v_delivery numeric;
  v_deposit numeric;
begin
  select * into v_request from public.custom_cake_requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Custom cake request not found'; end if;

  select * into v_quote from public.custom_cake_quotes where request_id = p_request_id for update;
  if v_quote.id is null then raise exception 'Quotation is missing for this custom cake request'; end if;

  v_total := v_quote.amount;
  v_deposit := coalesce(v_quote.deposit_amount, 0);
  v_delivery := coalesce(v_quote.delivery_fee, 0);
  v_order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number, user_id, customer_name, customer_phone, customer_email,
    city, area, delivery_address, landmark, delivery_instructions, preferred_delivery_at,
    subtotal, delivery_fee, discount, total, payment_method, status, admin_notes
  )
  values (
    v_order_number,
    v_request.user_id,
    v_request.customer_name,
    v_request.phone,
    v_request.email,
    v_request.city,
    v_request.area,
    v_request.delivery_address,
    v_request.landmark,
    v_request.delivery_instructions,
    v_request.preferred_delivery_at,
    v_total,
    v_delivery,
    0,
    v_total + v_delivery,
    'cod'::public.payment_method,
    'confirmed'::public.order_status,
    'Converted from Custom Cake Request #' || v_request.request_number
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_name, sku, unit_price, quantity, line_total, variation_title
  )
  values (
    v_order_id,
    'Custom Cake: ' || v_request.cake_type,
    'CC-' || upper(substring(v_request.request_number from 4)),
    v_total,
    coalesce(v_request.quantity, 1),
    v_total,
    'Size: ' || v_request.cake_size || ' | Flavour: ' || v_request.flavor
  );

  insert into public.payments (order_id, method, status, note)
  values (
    v_order_id,
    'cod'::public.payment_method,
    case when v_deposit > 0 then 'pending_verification'::public.payment_status else 'pending'::public.payment_status end,
    'Deposit Amount Required: PKR ' || v_deposit
  );

  insert into public.order_status_history (order_id, new_status, note, changed_by)
  values (
    v_order_id,
    'confirmed'::public.order_status,
    'Converted from custom cake request #' || v_request.request_number,
    p_admin_id
  );

  update public.custom_cake_requests
  set linked_order_id = v_order_id, status = 'confirmed'::public.custom_cake_status
  where id = p_request_id;

  insert into public.custom_cake_status_history (request_id, old_status, new_status, note, changed_by)
  values (p_request_id, v_request.status, 'confirmed'::public.custom_cake_status, 'Converted to Order #' || v_order_number, p_admin_id);

  return v_order_number;
end;
$$;

grant execute on function public.convert_custom_cake_to_order to authenticated;

-- TRACK ORDER & CUSTOM CAKE RPCs
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb language sql security definer set search_path = public
as $$
  select to_jsonb(o) || jsonb_build_object(
    'history', coalesce((select jsonb_agg(h order by h.created_at) from public.order_status_history h where h.order_id = o.id), '[]'::jsonb),
    'courier', case when o.courier_id is not null then (select to_jsonb(c) from public.couriers c where c.id = o.courier_id) else null end
  )
  from public.orders o
  where upper(o.order_number) = upper(trim(p_order_number))
    and regexp_replace(o.customer_phone, '[^0-9]', '', 'g') = regexp_replace(trim(p_phone), '[^0-9]', '', 'g');
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;

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

grant execute on function public.create_custom_cake_request(jsonb) to anon, authenticated;

create or replace function public.track_custom_cake(p_request_number text, p_phone text)
returns jsonb language sql security definer set search_path = public
as $$
  select to_jsonb(r) || jsonb_build_object('history', coalesce((select jsonb_agg(h order by h.created_at) from public.custom_cake_status_history h where h.request_id = r.id), '[]'::jsonb), 'quote', (select to_jsonb(q) from public.custom_cake_quotes q where q.request_id = r.id))
  from public.custom_cake_requests r
  where upper(r.request_number) = upper(trim(p_request_number)) and regexp_replace(r.phone, '[^0-9]', '', 'g') = regexp_replace(trim(p_phone), '[^0-9]', '', 'g');
$$;

grant execute on function public.track_custom_cake(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_attributes enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.product_attribute_images enable row level security;
alter table public.product_variations enable row level security;
alter table public.product_variation_images enable row level security;
alter table public.product_faqs enable row level security;
alter table public.product_relations enable row level security;
alter table public.global_attributes enable row level security;
alter table public.global_attribute_values enable row level security;
alter table public.category_attribute_templates enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.couriers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.reviews enable row level security;
alter table public.custom_cake_requests enable row level security;
alter table public.custom_cake_images enable row level security;
alter table public.custom_cake_quotes enable row level security;
alter table public.custom_cake_status_history enable row level security;
alter table public.deals enable row level security;
alter table public.deal_products enable row level security;
alter table public.banners enable row level security;
alter table public.faqs enable row level security;
alter table public.site_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.email_outbox enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.media enable row level security;

-- PROFILES POLICIES
drop policy if exists "profiles own row" on public.profiles;
create policy "profiles own row" on public.profiles for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles update own row" on public.profiles;
create policy "profiles update own row" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- CATALOG PUBLIC / ADMIN POLICIES
drop policy if exists "anon active categories" on public.categories;
create policy "anon active categories" on public.categories for select to anon using (is_active = true);

drop policy if exists "auth active categories" on public.categories;
create policy "auth active categories" on public.categories for select to authenticated using (is_active = true or (select private.is_admin()));

drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public brands" on public.brands;
create policy "public brands" on public.brands for select to anon, authenticated using (true);

drop policy if exists "admins manage brands" on public.brands;
create policy "admins manage brands" on public.brands for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "anon published products" on public.products;
create policy "anon published products" on public.products for select to anon using (is_published = true);

drop policy if exists "auth published products" on public.products;
create policy "auth published products" on public.products for select to authenticated using (is_published = true or (select private.is_admin()));

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "anon product images" on public.product_images;
create policy "anon product images" on public.product_images for select to anon using (exists (select 1 from public.products p where p.id = product_id and p.is_published = true));

drop policy if exists "auth product images" on public.product_images;
create policy "auth product images" on public.product_images for select to authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.is_published = true or (select private.is_admin()))));

drop policy if exists "admins manage product images" on public.product_images;
create policy "admins manage product images" on public.product_images for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "anon read active product variations" on public.product_variations;
create policy "anon read active product variations" on public.product_variations for select to anon using (status = 'active' and exists (select 1 from public.products p where p.id = product_id and p.is_published = true));

drop policy if exists "auth read product variations" on public.product_variations;
create policy "auth read product variations" on public.product_variations for select to authenticated using ((status = 'active' and exists (select 1 from public.products p where p.id = product_id and p.is_published = true)) or (select private.is_admin()));

drop policy if exists "admins manage product variations" on public.product_variations;
create policy "admins manage product variations" on public.product_variations for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public product attributes" on public.product_attributes;
create policy "public product attributes" on public.product_attributes for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.is_published));

drop policy if exists "admins manage product attributes" on public.product_attributes;
create policy "admins manage product attributes" on public.product_attributes for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public product attribute values" on public.product_attribute_values;
create policy "public product attribute values" on public.product_attribute_values for select to anon, authenticated using (exists (select 1 from public.product_attributes a join public.products p on p.id = a.product_id where a.id = attribute_id and p.is_published));

drop policy if exists "admins manage product attribute values" on public.product_attribute_values;
create policy "admins manage product attribute values" on public.product_attribute_values for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public product attribute images" on public.product_attribute_images;
create policy "public product attribute images" on public.product_attribute_images for select to anon, authenticated using (exists (select 1 from public.product_attribute_values v join public.product_attributes a on a.id = v.attribute_id join public.products p on p.id = a.product_id where v.id = attribute_value_id and (p.is_published or (select private.is_admin()))));

drop policy if exists "admins manage product attribute images" on public.product_attribute_images;
create policy "admins manage product attribute images" on public.product_attribute_images for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public product variation images" on public.product_variation_images;
create policy "public product variation images" on public.product_variation_images for select to anon, authenticated using (exists (select 1 from public.product_variations v join public.products p on p.id = v.product_id where v.id = variation_id and p.is_published and v.status = 'active'));

drop policy if exists "admins manage product variation images" on public.product_variation_images;
create policy "admins manage product variation images" on public.product_variation_images for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public product faqs" on public.product_faqs;
create policy "public product faqs" on public.product_faqs for select to anon, authenticated using (is_published and exists (select 1 from public.products p where p.id = product_id and p.is_published));

drop policy if exists "admins manage product faqs" on public.product_faqs;
create policy "admins manage product faqs" on public.product_faqs for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public product relations" on public.product_relations;
create policy "public product relations" on public.product_relations for select to anon, authenticated using (exists (select 1 from public.products p where p.id = source_product_id and p.is_published));

drop policy if exists "admins manage product relations" on public.product_relations;
create policy "admins manage product relations" on public.product_relations for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public global attributes" on public.global_attributes;
create policy "public global attributes" on public.global_attributes for select to anon, authenticated using (true);

drop policy if exists "admins manage global attributes" on public.global_attributes;
create policy "admins manage global attributes" on public.global_attributes for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public global attribute values" on public.global_attribute_values;
create policy "public global attribute values" on public.global_attribute_values for select to anon, authenticated using (is_active = true);

drop policy if exists "admins manage global attribute values" on public.global_attribute_values;
create policy "admins manage global attribute values" on public.global_attribute_values for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public category attribute templates" on public.category_attribute_templates;
create policy "public category attribute templates" on public.category_attribute_templates for select to anon, authenticated using (true);

drop policy if exists "admins manage category attribute templates" on public.category_attribute_templates;
create policy "admins manage category attribute templates" on public.category_attribute_templates for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins manage inventory" on public.inventory;
create policy "admins manage inventory" on public.inventory for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- USER DATA POLICIES
drop policy if exists "customers own carts" on public.carts;
create policy "customers own carts" on public.carts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "customers own cart items" on public.cart_items;
create policy "customers own cart items" on public.cart_items for all to authenticated using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

drop policy if exists "customers own addresses" on public.addresses;
create policy "customers own addresses" on public.addresses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "customers own orders" on public.orders;
create policy "customers own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own order items" on public.order_items;
create policy "customers own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

drop policy if exists "admins manage order items" on public.order_items;
create policy "admins manage order items" on public.order_items for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own payments" on public.payments;
create policy "customers own payments" on public.payments for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

drop policy if exists "admins manage payments" on public.payments;
create policy "admins manage payments" on public.payments for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins manage order history" on public.order_status_history;
create policy "admins manage order history" on public.order_status_history for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own wishlist" on public.wishlists;
create policy "customers own wishlist" on public.wishlists for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "customers own wishlist items" on public.wishlist_items;
create policy "customers own wishlist items" on public.wishlist_items for all to authenticated using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = (select auth.uid())));

drop policy if exists "customers own recently viewed" on public.recently_viewed;
create policy "customers own recently viewed" on public.recently_viewed for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "approved reviews public" on public.reviews;
create policy "approved reviews public" on public.reviews for select using (status = 'approved' or is_approved = true or (auth.uid() is not null and auth.uid() = user_id) or (select private.is_admin()));

drop policy if exists "customers write verified reviews" on public.reviews;
create policy "customers write verified reviews" on public.reviews for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.orders o join public.order_items oi on oi.order_id = o.id where o.id = order_id and oi.product_id = product_id and o.user_id = (select auth.uid()) and o.status = 'delivered'));

drop policy if exists "admins manage reviews" on public.reviews;
create policy "admins manage reviews" on public.reviews for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own custom requests" on public.custom_cake_requests;
create policy "customers own custom requests" on public.custom_cake_requests for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "customers create custom requests" on public.custom_cake_requests;
create policy "customers create custom requests" on public.custom_cake_requests for insert to anon, authenticated with check ((select auth.uid()) = user_id or user_id is null);

drop policy if exists "admins manage customers cakes" on public.custom_cake_requests;
create policy "admins manage customers cakes" on public.custom_cake_requests for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins manage cake images" on public.custom_cake_images;
create policy "admins manage cake images" on public.custom_cake_images for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own quote" on public.custom_cake_quotes;
create policy "customers own quote" on public.custom_cake_quotes for select to authenticated using (exists (select 1 from public.custom_cake_requests r where r.id = request_id and r.user_id = (select auth.uid())));

drop policy if exists "admins manage cake quotes" on public.custom_cake_quotes;
create policy "admins manage cake quotes" on public.custom_cake_quotes for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own cake history" on public.custom_cake_status_history;
create policy "customers own cake history" on public.custom_cake_status_history for select to authenticated using (exists (select 1 from public.custom_cake_requests r where r.id = request_id and r.user_id = (select auth.uid())));

drop policy if exists "admins manage cake history" on public.custom_cake_status_history;
create policy "admins manage cake history" on public.custom_cake_status_history for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "couriers readable by all" on public.couriers;
create policy "couriers readable by all" on public.couriers for select using (true);

drop policy if exists "couriers manageable by admins" on public.couriers;
create policy "couriers manageable by admins" on public.couriers for all using ((select private.is_admin()));

drop policy if exists "public read deals" on public.deals;
create policy "public read deals" on public.deals for select using (true);

drop policy if exists "admin all deals" on public.deals;
create policy "admin all deals" on public.deals for all using ((select private.is_admin()) = true) with check ((select private.is_admin()) = true);

drop policy if exists "public read deal_products" on public.deal_products;
create policy "public read deal_products" on public.deal_products for select using (true);

drop policy if exists "admin all deal_products" on public.deal_products;
create policy "admin all deal_products" on public.deal_products for all using ((select private.is_admin()) = true) with check ((select private.is_admin()) = true);

drop policy if exists "anon active banners" on public.banners;
create policy "anon active banners" on public.banners for select to anon using (is_active = true);

drop policy if exists "auth active banners" on public.banners;
create policy "auth active banners" on public.banners for select to authenticated using (is_active = true or (select private.is_admin()));

drop policy if exists "admins manage banners" on public.banners;
create policy "admins manage banners" on public.banners for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "anon published faqs" on public.faqs;
create policy "anon published faqs" on public.faqs for select to anon using (is_published = true);

drop policy if exists "auth published faqs" on public.faqs;
create policy "auth published faqs" on public.faqs for select to authenticated using (is_published = true or (select private.is_admin()));

drop policy if exists "admins manage faqs" on public.faqs;
create policy "admins manage faqs" on public.faqs for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings" on public.site_settings for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "customers own notifications" on public.notifications;
create policy "customers own notifications" on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "admins manage email outbox" on public.email_outbox;
create policy "admins manage email outbox" on public.email_outbox for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins manage logs" on public.admin_activity_logs;
create policy "admins manage logs" on public.admin_activity_logs for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public media view" on public.media;
create policy "public media view" on public.media for select to anon, authenticated using (true);

drop policy if exists "admins manage media" on public.media;
create policy "admins manage media" on public.media for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- DATA API GRANTS
grant select on public.categories to anon, authenticated;
grant select on public.brands to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.product_attributes to anon, authenticated;
grant select on public.product_attribute_values to anon, authenticated;
grant select on public.product_attribute_images to anon, authenticated;
grant select on public.product_variations to anon, authenticated;
grant select on public.product_variation_images to anon, authenticated;
grant select on public.product_faqs to anon, authenticated;
grant select on public.product_relations to anon, authenticated;
grant select on public.global_attributes to anon, authenticated;
grant select on public.global_attribute_values to anon, authenticated;
grant select on public.category_attribute_templates to anon, authenticated;
grant select on public.banners to anon, authenticated;
grant select on public.faqs to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.couriers to anon, authenticated;
grant select on public.deals to anon, authenticated;
grant select on public.deal_products to anon, authenticated;
grant select on public.media to anon, authenticated;

grant all on public.categories to authenticated;
grant all on public.brands to authenticated;
grant all on public.products to authenticated;
grant all on public.product_images to authenticated;
grant all on public.product_attributes to authenticated;
grant all on public.product_attribute_values to authenticated;
grant all on public.product_attribute_images to authenticated;
grant all on public.product_variations to authenticated;
grant all on public.product_variation_images to authenticated;
grant all on public.product_faqs to authenticated;
grant all on public.product_relations to authenticated;
grant all on public.global_attributes to authenticated;
grant all on public.global_attribute_values to authenticated;
grant all on public.category_attribute_templates to authenticated;
grant all on public.inventory to authenticated;
grant all on public.carts to authenticated;
grant all on public.cart_items to authenticated;
grant all on public.addresses to authenticated;
grant all on public.orders to authenticated;
grant all on public.order_items to authenticated;
grant all on public.payments to authenticated;
grant all on public.order_status_history to authenticated;
grant all on public.wishlists to authenticated;
grant all on public.wishlist_items to authenticated;
grant all on public.recently_viewed to authenticated;
grant all on public.reviews to authenticated;
grant all on public.custom_cake_requests to authenticated;
grant all on public.custom_cake_images to authenticated;
grant all on public.custom_cake_quotes to authenticated;
grant all on public.custom_cake_status_history to authenticated;
grant all on public.deals to authenticated;
grant all on public.deal_products to authenticated;
grant all on public.banners to authenticated;
grant all on public.faqs to authenticated;
grant all on public.site_settings to authenticated;
grant all on public.notifications to authenticated;
grant all on public.email_outbox to authenticated;
grant all on public.admin_activity_logs to authenticated;
grant all on public.media to authenticated;

-- ----------------------------------------------------------------------------
-- 8. STORAGE BUCKETS SETUP & SECURITY POLICIES
-- ----------------------------------------------------------------------------
insert into storage.buckets(id, name, public) values
  ('product-images', 'product-images', true),
  ('category-images', 'category-images', true),
  ('banners', 'banners', true),
  ('custom-cake-references', 'custom-cake-references', false),
  ('payment-receipts', 'payment-receipts', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public catalog storage read" on storage.objects;
create policy "public catalog storage read" on storage.objects for select to anon, authenticated using (bucket_id in ('product-images','category-images','banners'));

drop policy if exists "admins manage public storage" on storage.objects;
create policy "admins manage public storage" on storage.objects for all to authenticated using ((select private.is_admin()) and bucket_id in ('product-images','category-images','banners')) with check ((select private.is_admin()) and bucket_id in ('product-images','category-images','banners'));

drop policy if exists "customers upload private cake refs" on storage.objects;
create policy "customers upload private cake refs" on storage.objects for insert to anon, authenticated with check (bucket_id = 'custom-cake-references');

drop policy if exists "admins manage private storage" on storage.objects;
create policy "admins manage private storage" on storage.objects for all to authenticated using ((select private.is_admin()) and bucket_id in ('custom-cake-references','payment-receipts')) with check ((select private.is_admin()) and bucket_id in ('custom-cake-references','payment-receipts'));

-- ----------------------------------------------------------------------------
-- 9. ESSENTIAL REQUIRED SEED DATA (NO DUMMY PRODUCTS)
-- ----------------------------------------------------------------------------

-- SEED ESSENTIAL CATEGORIES
insert into public.categories (name, slug, description, image_path, sort_order, is_active, is_published) values
  ('Celebration Cakes', 'cakes', 'Layer cakes, cream cakes and celebration centrepieces.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', 1, true, true),
  ('Pastries', 'pastries', 'Flaky morning bakes and buttery tea-time favourites.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85', 2, true, true),
  ('Cupcakes', 'cupcakes', 'Small-batch cupcakes for gifting and sharing.', 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=900&q=85', 3, true, true),
  ('Brownies', 'brownies', 'Dense, fudgy trays with generous chocolate.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', 4, true, true),
  ('Cookies', 'cookies', 'Crisp edges, soft centres and bakery-fresh boxes.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85', 5, true, true),
  ('Desserts', 'desserts', 'Individual desserts for sweet little moments.', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85', 6, true, true)
on conflict (slug) do update set 
  name = excluded.name, 
  description = excluded.description, 
  image_path = excluded.image_path, 
  is_active = excluded.is_active,
  is_published = excluded.is_published;

-- SEED GLOBAL ATTRIBUTES
insert into public.global_attributes (name, slug, display_type, description) values
  ('Size', 'size', 'button', 'Standard product dimensions/sizes'),
  ('Color', 'color', 'color', 'Visual color swatches'),
  ('Flavor', 'flavor', 'radio', 'Bakery and edible product flavors'),
  ('Strap Color', 'strap-color', 'color', 'Watch strap colors'),
  ('Dial Color', 'dial-color', 'color', 'Watch dial colors'),
  ('Material', 'material', 'button', 'Construction material')
on conflict (slug) do nothing;

-- SEED PAKISTAN COURIERS
insert into public.couriers (name, code, website_url, tracking_url_template, phone, sort_order) values
  ('TCS Express', 'tcs', 'https://www.tcsexpress.com', 'https://www.tcsexpress.com/tracking?track={tracking_number}', '111-123-456', 1),
  ('Leopards Courier', 'leopards', 'https://www.leopardscourier.com', 'https://www.leopardscourier.com/tracking?track={tracking_number}', '021-111-300-300', 2),
  ('Trax Logistics', 'trax', 'https://trax.pk', 'https://trax.pk/tracking?cn={tracking_number}', '021-111-118-729', 3),
  ('M&P Express', 'mnp', 'https://www.mulphilog.com', 'https://www.mulphilog.com/tracking?cn={tracking_number}', '021-111-202-202', 4),
  ('CallCourier', 'callcourier', 'https://callcourier.com.pk', 'https://callcourier.com.pk/tracking?cn={tracking_number}', '042-111-786-227', 5),
  ('Bake Mart Express Fleet', 'bakemart_fleet', null, null, '+92 300 1234567', 6)
on conflict (code) do update set
  name = excluded.name,
  website_url = excluded.website_url,
  tracking_url_template = excluded.tracking_url_template,
  phone = excluded.phone;

-- SEED BANNERS
insert into public.banners (title, body, image_path, cta_label, cta_href, is_active, sort_order) values
  ('A little more joy in every bite.', 'Premium cakes, flaky pastries and tiny celebrations baked fresh in our kitchen.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=88', 'Shop freshly baked', '/shop', true, 1),
  ('Your idea, our icing.', 'Tell us what would make your moment extra special.', 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=1600&q=88', 'Start a custom cake', '/custom-cake', true, 2)
on conflict do nothing;

-- SEED FAQS
insert into public.faqs (question, answer, sort_order, is_published) values
  ('How fresh are the bakes?', 'Every product is prepared in small batches and packed for your delivery window.', 1, true),
  ('Where do you deliver?', 'We currently accept orders for Lahore and nearby delivery areas. Add more cities in Admin settings.', 2, true),
  ('Can I order a custom cake?', 'Yes. Share your cake brief and reference image through the Custom Cake Studio and our team will prepare a quote.', 3, true),
  ('Which payment methods are available?', 'Cash on Delivery and bank transfer are available. Bank transfer orders are dispatched after receipt verification.', 4, true)
on conflict do nothing;

-- SEED SITE SETTINGS
insert into public.site_settings (key, value) values
  ('store', '{"name":"Bake Mart Bazaar","email":"hello@bakemartbazaar.pk","phone":"0321-1234567","city":"Lahore, Pakistan"}'),
  ('delivery', '{"free_threshold":3000,"fee":250,"same_day_cutoff":"13:00","cities":["Lahore","Islamabad","Rawalpindi","Karachi"]}')
on conflict (key) do update set value = excluded.value;

-- ============================================================================
-- END OF MASTER SCHEMA
-- ============================================================================
