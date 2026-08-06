-- Fix: "permission denied for function is_admin"
--
-- The original public-read policies were applied to both `anon` and `authenticated`
-- but called private.is_admin() which had REVOKE ALL from anon. This caused a
-- permission-denied error for every anonymous visitor.
--
-- Strategy:
--   1. Grant EXECUTE on private.is_admin() to authenticated only.
--   2. Drop the combined anon+authenticated public-read policies.
--   3. Re-create them as two separate policies per table:
--        a. anon-only policy  → simple column check (no function call)
--        b. authenticated policy → column check OR is_admin() for admin preview

-- ─── Grant execute to authenticated only ────────────────────────────────────
grant execute on function private.is_admin() to authenticated;

-- ─── categories ─────────────────────────────────────────────────────────────
drop policy if exists "public active categories" on public.categories;
create policy "anon active categories"
  on public.categories for select to anon
  using (is_active = true);
create policy "auth active categories"
  on public.categories for select to authenticated
  using (is_active = true or (select private.is_admin()));

-- ─── products ────────────────────────────────────────────────────────────────
drop policy if exists "public published products" on public.products;
create policy "anon published products"
  on public.products for select to anon
  using (is_published = true);
create policy "auth published products"
  on public.products for select to authenticated
  using (is_published = true or (select private.is_admin()));

-- ─── product_images ──────────────────────────────────────────────────────────
drop policy if exists "public product images" on public.product_images;
create policy "anon product images"
  on public.product_images for select to anon
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.is_published = true
  ));
create policy "auth product images"
  on public.product_images for select to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and (p.is_published = true or (select private.is_admin()))
  ));

-- ─── banners ─────────────────────────────────────────────────────────────────
drop policy if exists "public active banners" on public.banners;
create policy "anon active banners"
  on public.banners for select to anon
  using (is_active = true);
create policy "auth active banners"
  on public.banners for select to authenticated
  using (is_active = true or (select private.is_admin()));

-- ─── faqs ────────────────────────────────────────────────────────────────────
drop policy if exists "public published faqs" on public.faqs;
create policy "anon published faqs"
  on public.faqs for select to anon
  using (is_published = true);
create policy "auth published faqs"
  on public.faqs for select to authenticated
  using (is_published = true or (select private.is_admin()));
