-- Migration 0010: Verified Product Reviews Upgrade

-- 1. Make user_id nullable for guest orders
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop legacy constraint if existing
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_user_id_order_id_key;

-- 3. Add unique constraint per order and product (one review per product per order)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_product_idx ON public.reviews (order_id, product_id);

-- 4. Add columns for guest details, moderation status, admin notes, safe reviewer name, and audit fields
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS is_verified_purchase boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_reported boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 5. Backfill existing records
UPDATE public.reviews
SET status = CASE WHEN is_approved THEN 'approved' ELSE 'pending' END
WHERE status IS NULL;

-- Ensure is_approved is synced with status
UPDATE public.reviews
SET is_approved = (status = 'approved');

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS reviews_status_created_idx ON public.reviews(status, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_product_status_idx ON public.reviews(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_order_id_idx ON public.reviews(order_id);

-- 7. Update RLS Policies
DROP POLICY IF EXISTS "approved reviews public" ON public.reviews;
CREATE POLICY "approved reviews public" ON public.reviews FOR SELECT USING (
  status = 'approved' OR is_approved = true OR (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (SELECT private.is_admin())
);

DROP POLICY IF EXISTS "admins manage reviews" ON public.reviews;
CREATE POLICY "admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (
  (SELECT private.is_admin())
) WITH CHECK (
  (SELECT private.is_admin())
);
