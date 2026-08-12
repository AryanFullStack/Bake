import https from "https";

let migrationAttempted = false;

export async function ensureReviewSchema() {
  if (migrationAttempted) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  migrationAttempted = true;

  const sql = `
    ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_user_id_order_id_key;
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_profiles_fkey;
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_product_idx ON public.reviews (order_id, product_id);
    
    ALTER TABLE public.reviews
      ADD COLUMN IF NOT EXISTS guest_name text,
      ADD COLUMN IF NOT EXISTS guest_email text,
      ADD COLUMN IF NOT EXISTS guest_phone text,
      ADD COLUMN IF NOT EXISTS reviewer_name text,
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS admin_note text,
      ADD COLUMN IF NOT EXISTS is_verified_purchase boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS is_reported boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
    
    UPDATE public.reviews SET status = CASE WHEN is_approved = true THEN 'approved' ELSE 'pending' END WHERE status IS NULL;
  `;

  try {
    const payload = JSON.stringify({ query: sql });
    const hostname = new URL(url).hostname;
    await new Promise((resolve) => {
      const req = https.request(
        {
          hostname,
          path: "/pg/query",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (d) => (data += d));
          res.on("end", () => resolve(data));
        }
      );
      req.on("error", () => resolve(null));
      req.write(payload);
      req.end();
    });
  } catch (err) {
    console.error("[ensureReviewSchema error]:", err);
  }
}

let mediaMigrationAttempted = false;

export async function ensureMediaSchema() {
  if (mediaMigrationAttempted) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  mediaMigrationAttempted = true;

  const sql = `
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

    create index if not exists media_folder_idx on public.media(folder);
    create index if not exists media_type_idx on public.media(media_type);
    create index if not exists media_created_at_idx on public.media(created_at desc);
    create index if not exists media_search_trgm_idx on public.media using gin (
      (coalesce(filename,'') || ' ' || coalesce(title,'') || ' ' || coalesce(alt_text,'') || ' ' || coalesce(original_filename,'')) gin_trgm_ops
    );

    alter table public.media enable row level security;

    drop policy if exists "public media view" on public.media;
    create policy "public media view" on public.media
      for select to anon, authenticated
      using (true);

    drop policy if exists "admins manage media" on public.media;
    create policy "admins manage media" on public.media
      for all to authenticated
      using ((select private.is_admin()))
      with check ((select private.is_admin()));
  `;

  try {
    const payload = JSON.stringify({ query: sql });
    const hostname = new URL(url).hostname;
    await new Promise((resolve) => {
      const req = https.request(
        {
          hostname,
          path: "/pg/query",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (d) => (data += d));
          res.on("end", () => resolve(data));
        }
      );
      req.on("error", () => resolve(null));
      req.write(payload);
      req.end();
    });
  } catch (err) {
    console.error("[ensureMediaSchema error]:", err);
  }
}

