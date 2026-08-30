-- Migration: 0013_address_default_and_order_snapshots.sql
-- Description: Adds is_default to addresses, default address trigger, and enhances order variation snapshots.

alter table public.addresses
  add column if not exists is_default boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists addresses_user_default_idx on public.addresses(user_id, is_default);

-- Trigger to ensure only one default address per user
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

-- Updated order creation RPC function with exact item and variation snapshots
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

  -- Cast payment method safely
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
