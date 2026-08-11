# Bake Mart Bazaar

Database-driven bakery commerce for Bake Mart Bazaar / Pickled Bean. The app uses Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL/RLS and Supabase Storage.

## Local setup

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill in the Supabase project values. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it.

Apply the SQL in order through the Supabase SQL editor or Supabase CLI:

1. `supabase/migrations/0001_bake_mart_foundation.sql`
2. `supabase/migrations/0002_profile_trigger_and_admin.sql`
3. `supabase/migrations/0003_ecommerce_security_and_operations.sql`
4. `supabase/seed.sql` for replaceable demo catalogue data

The seed is intentionally database-only. React components never contain product/category/order/customer fixtures; replacing the demo catalogue means replacing the seed or importing the client's catalogue into the same tables.

## Supabase responsibilities

- Public storefront reads only active categories/banners/FAQs and published products.
- Customer rows, addresses, orders, payments, wishlists, recently viewed products and custom-cake records are protected by RLS.
- Admin/manager/fulfilment authorization comes from `public.profiles.role`, never editable user metadata.
- Product images, category images and banners belong in public Storage buckets; custom-cake references and payment receipts belong in private buckets.
- Guest checkout uses a database RPC that locks products, validates current stock/prices, creates the order/items/payment/status history, and decrements stock atomically.
- Public tracking is handled by constrained `track_order` and `track_custom_cake` RPCs requiring the matching phone number.

## Production deployment

The included `Dockerfile` builds Next.js standalone output for Hostinger VPS, Coolify or any Docker host. Configure these environment variables in the deployment platform:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- Optional SMTP variables for the email outbox worker: `HOSTINGER_SMTP_HOST`, `HOSTINGER_SMTP_PORT`, `HOSTINGER_SMTP_USER`, `HOSTINGER_SMTP_PASSWORD`

Set the Supabase Auth site URL and redirect URLs to the production domain, create the Storage buckets through migration `0003`, and promote the first administrator by updating the `profiles.role` value after that user registers. Do not use local Docker volumes for permanent media.

## Verification

```bash
pnpm typecheck
pnpm build
```

The admin dashboard, orders, products, customers, reviews, custom cakes and settings pages are protected by both Next.js route checks and database RLS policies.
