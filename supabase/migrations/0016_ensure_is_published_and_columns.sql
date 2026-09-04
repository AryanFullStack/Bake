-- Migration 0016: Comprehensive enum value and column existence guards across all database tables
-- Resolves ERROR 22P02 (missing enum values like 'fulfilment') & ERROR 42703 (missing columns) when running on pre-existing databases.

-- Enum values
alter type public.user_role add value if not exists 'customer';
alter type public.user_role add value if not exists 'admin';
alter type public.user_role add value if not exists 'manager';
alter type public.user_role add value if not exists 'fulfilment';

alter type public.payment_method add value if not exists 'cod';
alter type public.payment_method add value if not exists 'bank_transfer';

alter type public.payment_status add value if not exists 'pending';
alter type public.payment_status add value if not exists 'pending_verification';
alter type public.payment_status add value if not exists 'paid';
alter type public.payment_status add value if not exists 'failed';
alter type public.payment_status add value if not exists 'refunded';

alter type public.order_status add value if not exists 'placed';
alter type public.order_status add value if not exists 'confirmed';
alter type public.order_status add value if not exists 'processing';
alter type public.order_status add value if not exists 'baking';
alter type public.order_status add value if not exists 'ready';
alter type public.order_status add value if not exists 'out_for_delivery';
alter type public.order_status add value if not exists 'delivered';
alter type public.order_status add value if not exists 'cancelled';
alter type public.order_status add value if not exists 'returned';

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

-- Grants for public schema objects
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- RLS Policy for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- Upsert admin profile for aryanwaheednew@gmail.com
INSERT INTO public.profiles (id, full_name, role)
VALUES ('0bde337b-c92e-4acd-9c2a-29fda9242a6e', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = EXCLUDED.full_name;

