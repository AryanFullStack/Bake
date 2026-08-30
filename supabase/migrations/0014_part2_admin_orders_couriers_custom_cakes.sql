-- Migration: 0014_part2_admin_orders_couriers_custom_cakes.sql
-- Description: Couriers table, atomic order creation RPCs, custom cake conversion, and indexes for Part 2.

-- 1. Ensure Couriers Table
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

-- Seed standard Pakistan couriers
insert into public.couriers (name, code, website_url, tracking_url_template, phone, sort_order)
values
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

-- Enable RLS on couriers
alter table public.couriers enable row level security;
drop policy if exists "couriers readable by all" on public.couriers;
create policy "couriers readable by all" on public.couriers for select using (true);

drop policy if exists "couriers manageable by admins" on public.couriers;
create policy "couriers manageable by admins" on public.couriers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'fulfilment'))
);

-- 2. Add columns to custom_cake_quotes if missing
alter table public.custom_cake_quotes
  add column if not exists deposit_amount numeric(12,2),
  add column if not exists delivery_fee numeric(12,2) not null default 0,
  add column if not exists expires_at timestamptz;

-- 3. Add couriers reference and columns on orders table
alter table public.orders
  add column if not exists courier_id uuid references public.couriers(id) on delete set null,
  add column if not exists courier_name text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists dispatched_at timestamptz,
  add column if not exists expected_delivery_at timestamptz,
  add column if not exists delivery_notes text,
  add column if not exists admin_notes text;

create index if not exists idx_orders_courier_tracking on public.orders(courier_id, tracking_number);
create index if not exists idx_custom_cake_requests_status on public.custom_cake_requests(status, created_at desc);

-- 4. Atomic Manual Admin Order Creation Function
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
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Order items cannot be empty';
  end if;

  -- Validate payment enums
  begin v_pay_method := p_payment_method::public.payment_method; exception when others then v_pay_method := 'cod'::public.payment_method; end;
  begin v_pay_status := p_payment_status::public.payment_status; exception when others then v_pay_status := 'pending'::public.payment_status; end;

  if p_courier_id is not null then
    select name into v_courier_name from public.couriers where id = p_courier_id;
  end if;

  -- Generate sequential order number
  v_order_number := 'BM-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  -- Pre-calculate subtotal
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

  -- Create Order Record
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

  -- Insert Order Items & Adjust Stock
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

  -- Create Payment Record
  insert into public.payments (order_id, method, status, verified_by, verified_at)
  values (
    v_order_id, v_pay_method, v_pay_status,
    case when v_pay_status = 'paid' then p_created_by else null end,
    case when v_pay_status = 'paid' then now() else null end
  );

  -- Create Status History Entry
  insert into public.order_status_history (order_id, new_status, note, changed_by)
  values (v_order_id, 'placed'::public.order_status, 'Manual order created by staff', p_created_by);

  return v_order_number;
end;
$$;

-- 5. Atomic Custom Cake → Order Conversion Function
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

  -- Insert Order Header
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

  -- Insert Custom Cake Order Line Item
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

  -- Insert Payment Record
  insert into public.payments (order_id, method, status, note)
  values (
    v_order_id,
    'cod'::public.payment_method,
    case when v_deposit > 0 then 'pending_verification'::public.payment_status else 'pending'::public.payment_status end,
    'Deposit Amount Required: PKR ' || v_deposit
  );

  -- Insert Order History
  insert into public.order_status_history (order_id, new_status, note, changed_by)
  values (
    v_order_id,
    'confirmed'::public.order_status,
    'Converted from custom cake request #' || v_request.request_number,
    p_admin_id
  );

  -- Update Custom Cake Request Link & Status
  update public.custom_cake_requests
  set linked_order_id = v_order_id, status = 'confirmed'::public.custom_cake_status
  where id = p_request_id;

  insert into public.custom_cake_status_history (request_id, old_status, new_status, note, changed_by)
  values (p_request_id, v_request.status, 'confirmed'::public.custom_cake_status, 'Converted to Order #' || v_order_number, p_admin_id);

  return v_order_number;
end;
$$;

grant execute on function public.create_admin_order to authenticated;
grant execute on function public.convert_custom_cake_to_order to authenticated;
