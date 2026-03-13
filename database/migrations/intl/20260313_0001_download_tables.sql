-- =====================================================
-- Download Packages and Events Tables
-- Date: 2026-03-13
-- =====================================================

begin;

-- Download packages table
create table if not exists public.download_packages (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  platform text not null,
  version text not null,
  title text not null,
  file_name text not null,
  file_size bigint not null default 0,
  mime_type text not null,
  release_notes text,
  is_active boolean not null default true,
  download_count integer not null default 0,
  storage_provider text not null,
  file_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_download_packages_region on public.download_packages (region);
create index if not exists idx_download_packages_platform on public.download_packages (platform);
create index if not exists idx_download_packages_is_active on public.download_packages (is_active);
create index if not exists idx_download_packages_created_at on public.download_packages (created_at desc);

-- Download events table
create table if not exists public.download_events (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null,
  region text not null,
  user_id text,
  user_email text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_download_events_package_id on public.download_events (package_id);
create index if not exists idx_download_events_user_email on public.download_events (user_email);
create index if not exists idx_download_events_created_at on public.download_events (created_at desc);

-- RLS policies
alter table public.download_packages enable row level security;
alter table public.download_events enable row level security;

drop policy if exists p_download_packages_service_all on public.download_packages;
create policy p_download_packages_service_all
  on public.download_packages
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists p_download_events_service_all on public.download_events;
create policy p_download_events_service_all
  on public.download_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
