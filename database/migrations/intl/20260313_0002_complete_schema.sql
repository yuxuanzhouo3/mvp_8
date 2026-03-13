-- =====================================================
-- Complete Schema for SiteHub INTL (Supabase)
-- Date: 2026-03-13
-- All missing tables for admin dashboard
-- =====================================================

begin;

-- web_users table
create table if not exists public.web_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text,
  name text,
  pro boolean default false,
  is_pro boolean default false,
  region text default 'overseas',
  referral_code text,
  referred_by text,
  referred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_users_email on public.web_users (email);
create index if not exists idx_web_users_referral_code on public.web_users (referral_code);

-- web_subscriptions table
create table if not exists public.web_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_email text unique,
  platform text default 'web',
  payment_method text,
  plan_type text,
  billing_cycle text,
  status text,
  start_time timestamptz,
  expire_time timestamptz,
  current_period_end timestamptz,
  auto_renew boolean default false,
  next_billing_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_subscriptions_user_email on public.web_subscriptions (user_email);
create index if not exists idx_web_subscriptions_expire_time on public.web_subscriptions (expire_time);

-- web_payment_transactions table
create table if not exists public.web_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_email text,
  payment_method text,
  status text,
  payment_status text,
  amount numeric,
  amount_usd numeric,
  amount_cny numeric,
  currency text,
  gross_amount numeric,
  transaction_id text,
  out_trade_no text,
  payment_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_payment_transactions_user_email on public.web_payment_transactions (user_email);
create index if not exists idx_web_payment_transactions_status on public.web_payment_transactions (status);
create index if not exists idx_web_payment_transactions_created_at on public.web_payment_transactions (created_at desc);

-- web_favorites table
create table if not exists public.web_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  site_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_web_favorites_user_site on public.web_favorites (user_id, site_id);
create index if not exists idx_web_favorites_user_id on public.web_favorites (user_id);

-- web_custom_sites table
create table if not exists public.web_custom_sites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  url text not null,
  icon text,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_custom_sites_user_id on public.web_custom_sites (user_id);

-- web_ads table
create table if not exists public.web_ads (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  title text not null,
  image_url text not null,
  link_url text not null,
  placement text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_ads_region on public.web_ads (region);
create index if not exists idx_web_ads_placement on public.web_ads (placement);
create index if not exists idx_web_ads_is_active on public.web_ads (is_active);

-- web_ad_clicks table
create table if not exists public.web_ad_clicks (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null,
  region text not null,
  placement text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_ad_clicks_ad_id on public.web_ad_clicks (ad_id);
create index if not exists idx_web_ad_clicks_created_at on public.web_ad_clicks (created_at desc);

-- web_credit_transactions table
create table if not exists public.web_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  amount integer not null,
  type text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_credit_transactions_user_id on public.web_credit_transactions (user_id);
create index if not exists idx_web_credit_transactions_created_at on public.web_credit_transactions (created_at desc);

-- profiles table (if not exists from Supabase auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  subscription_tier text,
  is_pro boolean default false,
  pro boolean default false,
  credits integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles (email);

-- RLS policies (service_role access)
alter table public.web_users enable row level security;
alter table public.web_subscriptions enable row level security;
alter table public.web_payment_transactions enable row level security;
alter table public.web_favorites enable row level security;
alter table public.web_custom_sites enable row level security;
alter table public.web_ads enable row level security;
alter table public.web_ad_clicks enable row level security;
alter table public.web_credit_transactions enable row level security;
alter table public.profiles enable row level security;

drop policy if exists p_web_users_service_all on public.web_users;
create policy p_web_users_service_all on public.web_users for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_web_subscriptions_service_all on public.web_subscriptions;
create policy p_web_subscriptions_service_all on public.web_subscriptions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_web_payment_transactions_service_all on public.web_payment_transactions;
create policy p_web_payment_transactions_service_all on public.web_payment_transactions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_web_favorites_service_all on public.web_favorites;
create policy p_web_favorites_service_all on public.web_favorites for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_web_custom_sites_service_all on public.web_custom_sites;
create policy p_web_custom_sites_service_all on public.web_custom_sites for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_web_ads_service_all on public.web_ads;
create policy p_web_ads_service_all on public.web_ads for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_web_ad_clicks_service_all on public.web_ad_clicks;
create policy p_web_ad_clicks_service_all on public.web_ad_clicks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_web_credit_transactions_service_all on public.web_credit_transactions;
create policy p_web_credit_transactions_service_all on public.web_credit_transactions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists p_profiles_service_all on public.profiles;
create policy p_profiles_service_all on public.profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

commit;
