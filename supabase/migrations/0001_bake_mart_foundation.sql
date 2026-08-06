create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.user_role as enum ('customer','admin','manager','fulfilment');
create type public.payment_method as enum ('cod','bank_transfer');
create type public.payment_status as enum ('pending','pending_verification','paid','failed','refunded');
create type public.order_status as enum ('placed','confirmed','processing','baking','ready','out_for_delivery','delivered','cancelled');
create type public.custom_cake_status as enum ('submitted','under_review','quotation_prepared','confirmation_required','confirmed','deposit_pending','in_production','ready','out_for_delivery','delivered','completed','cancelled','rejected');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, phone text, role public.user_role not null default 'customer', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text, image_path text, sort_order integer not null default 0, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.brands (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, created_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid references public.categories(id), brand_id uuid references public.brands(id), sku text unique not null, slug text unique not null, name text not null, description text, price numeric(12,2) not null check (price >= 0), sale_price numeric(12,2) check (sale_price is null or sale_price >= 0), stock_quantity integer not null default 0 check (stock_quantity >= 0), low_stock_threshold integer not null default 5, is_published boolean not null default false, is_featured boolean not null default false, is_bestseller boolean not null default false, seo_title text, seo_description text, tags text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.product_images (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, storage_path text not null, alt_text text, sort_order integer not null default 0, created_at timestamptz not null default now());
create table public.carts (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, guest_token text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.cart_items (id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id) on delete cascade, product_id uuid not null references public.products(id), quantity integer not null check (quantity > 0), unique(cart_id, product_id));
create table public.addresses (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, label text not null default 'Home', full_name text not null, phone text not null, city text not null, area text not null, address text not null, landmark text, instructions text, created_at timestamptz not null default now());
create table public.orders (id uuid primary key default gen_random_uuid(), order_number text unique not null, user_id uuid references auth.users(id) on delete set null, customer_name text not null, customer_phone text not null, customer_email text, city text not null, area text not null, delivery_address text not null, landmark text, delivery_instructions text, preferred_delivery_at timestamptz, subtotal numeric(12,2) not null, delivery_fee numeric(12,2) not null default 0, discount numeric(12,2) not null default 0, total numeric(12,2) not null, payment_method public.payment_method not null, status public.order_status not null default 'placed', created_at timestamptz not null default now());
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid references public.products(id), product_name text not null, sku text, unit_price numeric(12,2) not null, quantity integer not null check (quantity > 0), line_total numeric(12,2) not null);
create table public.payments (id uuid primary key default gen_random_uuid(), order_id uuid unique not null references public.orders(id) on delete cascade, method public.payment_method not null, status public.payment_status not null default 'pending', receipt_path text, verified_by uuid references auth.users(id), verified_at timestamptz, note text, created_at timestamptz not null default now());
create table public.order_status_history (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, old_status public.order_status, new_status public.order_status not null, note text, changed_by uuid references auth.users(id), created_at timestamptz not null default now());
create table public.wishlists (id uuid primary key default gen_random_uuid(), user_id uuid unique not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.wishlist_items (wishlist_id uuid not null references public.wishlists(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, created_at timestamptz not null default now(), primary key(wishlist_id, product_id));
create table public.recently_viewed (user_id uuid not null references auth.users(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, viewed_at timestamptz not null default now(), primary key(user_id, product_id));
create table public.reviews (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, order_id uuid not null references public.orders(id) on delete cascade, rating integer not null check (rating between 1 and 5), body text not null, is_approved boolean not null default false, created_at timestamptz not null default now(), unique(product_id, user_id, order_id));
create table public.custom_cake_requests (id uuid primary key default gen_random_uuid(), request_number text unique not null, user_id uuid references auth.users(id) on delete set null, customer_name text not null, phone text not null, email text, city text not null, area text not null, delivery_address text not null, landmark text, delivery_instructions text, preferred_delivery_at timestamptz, cake_type text not null, cake_size text not null, flavor text not null, quantity integer not null default 1, theme text, cake_message text, budget numeric(12,2), special_instructions text, status public.custom_cake_status not null default 'submitted', linked_order_id uuid references public.orders(id), created_at timestamptz not null default now());
create table public.custom_cake_images (id uuid primary key default gen_random_uuid(), request_id uuid not null references public.custom_cake_requests(id) on delete cascade, storage_path text not null, created_at timestamptz not null default now());
create table public.custom_cake_quotes (id uuid primary key default gen_random_uuid(), request_id uuid unique not null references public.custom_cake_requests(id) on delete cascade, amount numeric(12,2) not null, deposit_amount numeric(12,2), estimated_ready_at timestamptz, note text, status text not null default 'pending', created_by uuid references auth.users(id), created_at timestamptz not null default now(), decided_at timestamptz);
create table public.custom_cake_status_history (id uuid primary key default gen_random_uuid(), request_id uuid not null references public.custom_cake_requests(id) on delete cascade, old_status public.custom_cake_status, new_status public.custom_cake_status not null, note text, changed_by uuid references auth.users(id), created_at timestamptz not null default now());
create table public.banners (id uuid primary key default gen_random_uuid(), title text not null, body text, image_path text, cta_label text, cta_href text, is_active boolean not null default false, sort_order integer not null default 0);
create table public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text not null, sort_order integer not null default 0, is_published boolean not null default false);
create table public.site_settings (key text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, order_id uuid references public.orders(id) on delete cascade, custom_request_id uuid references public.custom_cake_requests(id) on delete cascade, type text not null, payload jsonb not null default '{}', read_at timestamptz, created_at timestamptz not null default now());
create table public.email_outbox (id uuid primary key default gen_random_uuid(), recipient text not null, template text not null, payload jsonb not null default '{}', status text not null default 'pending', attempts integer not null default 0, last_error text, sent_at timestamptz, created_at timestamptz not null default now());
create table public.admin_activity_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id), action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now());

create index products_search_idx on public.products using gin ((to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))));
create index products_tags_idx on public.products using gin(tags);
create index products_category_idx on public.products(category_id, is_published);
create index orders_tracking_idx on public.orders(order_number, customer_phone);
create index order_history_idx on public.order_status_history(order_id, created_at);
create index custom_tracking_idx on public.custom_cake_requests(request_number, phone);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.reviews enable row level security;
alter table public.custom_cake_requests enable row level security;
alter table public.custom_cake_images enable row level security;

create policy "profiles own row" on public.profiles for select using (auth.uid() = id);
create policy "customers own orders" on public.orders for select using (auth.uid() = user_id);
create policy "customers own order items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "customers own payments" on public.payments for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "customers own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "customers own wishlist" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "customers own wishlist items" on public.wishlist_items for all using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));
create policy "approved reviews public" on public.reviews for select using (is_approved = true or auth.uid() = user_id);
create policy "customers own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "customers own custom requests" on public.custom_cake_requests for select using (auth.uid() = user_id);
create policy "customers create custom requests" on public.custom_cake_requests for insert with check (auth.uid() = user_id or user_id is null);

create sequence if not exists public.order_number_seq start 10482;

create or replace function public.create_guest_order(p_customer jsonb, p_payment_method public.payment_method, p_items jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare item jsonb; product_row public.products%rowtype; order_id uuid; order_number text; subtotal numeric := 0; delivery numeric := 0; quantity integer; line numeric;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid and is_published = true for update;
    quantity := (item->>'quantity')::integer;
    if product_row.id is null or product_row.stock_quantity < quantity then raise exception 'One or more products are unavailable'; end if;
    line := coalesce(product_row.sale_price, product_row.price) * quantity; subtotal := subtotal + line;
  end loop;
  if subtotal < 3000 then delivery := 250; end if;
  order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  insert into public.orders(order_number, customer_name, customer_phone, customer_email, city, area, delivery_address, landmark, delivery_instructions, subtotal, delivery_fee, total, payment_method)
  values(order_number, p_customer->>'full_name', p_customer->>'phone', nullif(p_customer->>'email',''), p_customer->>'city', p_customer->>'area', p_customer->>'address', nullif(p_customer->>'landmark',''), nullif(p_customer->>'instructions',''), subtotal, delivery, subtotal + delivery, p_payment_method) returning id into order_id;
  for item in select * from jsonb_array_elements(p_items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid for update; quantity := (item->>'quantity')::integer; line := coalesce(product_row.sale_price, product_row.price) * quantity;
    insert into public.order_items(order_id, product_id, product_name, sku, unit_price, quantity, line_total) values(order_id, product_row.id, product_row.name, product_row.sku, coalesce(product_row.sale_price, product_row.price), quantity, line);
    update public.products set stock_quantity = stock_quantity - quantity where id = product_row.id;
  end loop;
  insert into public.payments(order_id, method, status) values(order_id, p_payment_method, case when p_payment_method = 'bank_transfer' then 'pending_verification' else 'pending' end);
  insert into public.order_status_history(order_id, new_status) values(order_id, 'placed');
  return order_number;
end; $$;
