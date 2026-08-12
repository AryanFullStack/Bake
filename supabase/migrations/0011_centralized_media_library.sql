-- Migration: 0011_centralized_media_library.sql
-- Description: Centralized media library metadata table, search indexes, and security policies for Hostinger VPS uploads.

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

-- Indexes for fast filtering, pagination and fuzzy search
create index if not exists media_folder_idx on public.media(folder);
create index if not exists media_type_idx on public.media(media_type);
create index if not exists media_created_at_idx on public.media(created_at desc);
create index if not exists media_search_trgm_idx on public.media using gin (
  (coalesce(filename,'') || ' ' || coalesce(title,'') || ' ' || coalesce(alt_text,'') || ' ' || coalesce(original_filename,'')) gin_trgm_ops
);

-- Trigger for auto-updating updated_at timestamp
create or replace function public.media_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_updated_at_trigger on public.media;
create trigger media_updated_at_trigger
  before update on public.media
  for each row execute function public.media_set_updated_at();

-- Enable RLS & Security Policies
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
