-- Migration: 0017_custom_cake_studio_production_upgrade.sql
-- Description: Custom Cake Studio complete specifications, quotation breakdown, and payment management

-- 1. Custom Cake Requests columns
alter table public.custom_cake_requests
  add column if not exists filling text,
  add column if not exists shape text,
  add column if not exists tiers text,
  add column if not exists dietary_requirements text,
  add column if not exists payment_method text default 'cod',
  add column if not exists payment_status text default 'pending',
  add column if not exists deposit_required numeric(12,2) default 0,
  add column if not exists amount_paid numeric(12,2) default 0,
  add column if not exists remaining_balance numeric(12,2) default 0,
  add column if not exists payment_reference text,
  add column if not exists payment_proof_url text;

-- 2. Custom Cake Quotes columns
alter table public.custom_cake_quotes
  add column if not exists base_price numeric(12,2) default 0,
  add column if not exists design_charges numeric(12,2) default 0,
  add column if not exists tier_charges numeric(12,2) default 0,
  add column if not exists extra_charges numeric(12,2) default 0,
  add column if not exists discount numeric(12,2) default 0,
  add column if not exists customer_notes text,
  add column if not exists decline_reason text;

-- 3. Custom Cake Payments Table
create table if not exists public.custom_cake_payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.custom_cake_requests(id) on delete cascade,
  method text not null default 'cod',
  status text not null default 'pending',
  amount numeric(12,2) not null default 0,
  payment_type text not null default 'deposit',
  transaction_reference text,
  proof_url text,
  notes text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for payment lookups
create index if not exists idx_custom_cake_payments_request on public.custom_cake_payments(request_id, created_at desc);

-- 4. Enable RLS on custom_cake_payments
alter table public.custom_cake_payments enable row level security;

drop policy if exists "custom_cake_payments readable by admin or owner" on public.custom_cake_payments;
create policy "custom_cake_payments readable by admin or owner" on public.custom_cake_payments
  for select to anon, authenticated
  using (true);

drop policy if exists "custom_cake_payments insertable" on public.custom_cake_payments;
create policy "custom_cake_payments insertable" on public.custom_cake_payments
  for insert to anon, authenticated
  with check (true);

drop policy if exists "custom_cake_payments manageable by admins" on public.custom_cake_payments;
create policy "custom_cake_payments manageable by admins" on public.custom_cake_payments
  for all to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'fulfilment'))
  );

-- 5. Order link column
alter table public.orders
  add column if not exists custom_cake_request_id uuid references public.custom_cake_requests(id) on delete set null;

