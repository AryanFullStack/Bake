-- ============================================================================
-- Bake Mart Bazaar - Database Clean Reset Script
-- File: supabase/reset_schema.sql
-- Description: Completely drops and recreates the public schema to wipe out 
--              any legacy / conflicting database tables, types, and schemas.
-- ============================================================================

-- Drop and recreate public schema
drop schema if exists public cascade;
create schema public;

-- Restore standard Supabase permissions on public schema
grant all on schema public to postgres;
grant all on schema public to public;
grant all on schema public to anon;
grant all on schema public to authenticated;
grant all on schema public to service_role;

-- Re-enable default extensions
create extension if not exists pgcrypto with schema public;
create extension if not exists pg_trgm with schema public;
