-- 1. Add returned status to order_status enum
alter type public.order_status add value if not exists 'returned';


-- 2. Create couriers table
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

-- Seed standard courier services in Pakistan
insert into public.couriers (name, code, website_url, tracking_url_template, phone, sort_order)
values
  ('Leopard Courier', 'leopard', 'https://www.leopardscourier.com', 'https://www.leopardscourier.com/tracking?cn={tracking_number}', '+92 21 111 300 300', 1),
  ('TCS Express', 'tcs', 'https://www.tcsexpress.com', 'https://www.tcsexpress.com/tracking?trackingNo={tracking_number}', '+92 21 111 123 456', 2),
  ('Trax Logistics', 'trax', 'https://trax.pk', 'https://trax.pk/tracking?tracking_number={tracking_number}', '+92 21 111 118 729', 3),
  ('Rider Delivery', 'rider', 'https://withrider.com', 'https://withrider.com/track/{tracking_number}', '+92 21 111 743 371', 4),
  ('Bake Mart Express Delivery', 'bake_mart_express', null, null, '+92 300 0000000', 5)
on conflict (code) do update set
  name = excluded.name,
  website_url = excluded.website_url,
  tracking_url_template = excluded.tracking_url_template,
  phone = excluded.phone,
  sort_order = excluded.sort_order;

-- 3. Extend orders table with courier, tracking, and internal note fields
alter table public.orders
  add column if not exists courier_id uuid references public.couriers(id) on delete set null,
  add column if not exists courier_name text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists dispatched_at timestamptz,
  add column if not exists expected_delivery_at timestamptz,
  add column if not exists delivery_notes text,
  add column if not exists admin_notes text;

-- 4. Extend payments table with transaction reference & payment notes
alter table public.payments
  add column if not exists transaction_reference text,
  add column if not exists payment_notes text;

-- 5. Indexes
create index if not exists orders_courier_idx on public.orders(courier_id);
create index if not exists orders_tracking_num_idx on public.orders(tracking_number);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists orders_created_at_desc_idx on public.orders(created_at desc);

-- 6. Enable RLS on couriers
alter table public.couriers enable row level security;

drop policy if exists "public read active couriers" on public.couriers;
create policy "public read active couriers" on public.couriers
  for select to anon, authenticated
  using (is_active or (select private.is_admin()));

drop policy if exists "admins manage couriers" on public.couriers;
create policy "admins manage couriers" on public.couriers
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 7. Update track_order RPC to include courier metadata
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
revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;
