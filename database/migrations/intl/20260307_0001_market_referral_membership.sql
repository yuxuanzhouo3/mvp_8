-- =====================================================
-- SiteHub INTL Market Referral + Membership Reward Migration
-- Date: 2026-03-07
-- Scope:
-- 1) Add referral tables for /market system
-- 2) Ensure web_users supports referral attribution fields
-- 3) Ensure web_subscriptions can be upserted by user_email
-- =====================================================

begin;

-- -----------------------------------------------------
-- 0) Helper: auto update updated_at
-- -----------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -----------------------------------------------------
-- 1) Users table compatibility for referrals
-- -----------------------------------------------------
alter table if exists public.web_users
  add column if not exists referral_code text,
  add column if not exists referred_by text,
  add column if not exists referred_at timestamptz,
  add column if not exists pro boolean default false,
  add column if not exists is_pro boolean default false,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_web_users_referral_code_unique
  on public.web_users (referral_code)
  where referral_code is not null and btrim(referral_code) <> '';

create index if not exists idx_web_users_referred_by
  on public.web_users (referred_by);

-- -----------------------------------------------------
-- 2) Subscriptions compatibility (for membership-day rewards)
-- -----------------------------------------------------
alter table if exists public.web_subscriptions
  add column if not exists user_id text,
  add column if not exists user_email text,
  add column if not exists platform text default 'web',
  add column if not exists payment_method text,
  add column if not exists plan_type text,
  add column if not exists billing_cycle text,
  add column if not exists status text,
  add column if not exists start_time timestamptz,
  add column if not exists expire_time timestamptz,
  add column if not exists auto_renew boolean default false,
  add column if not exists next_billing_date timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_web_subscriptions_user_email_unique
  on public.web_subscriptions (user_email)
  where user_email is not null and btrim(user_email) <> '';

create index if not exists idx_web_subscriptions_user_id
  on public.web_subscriptions (user_id);

create index if not exists idx_web_subscriptions_expire_time
  on public.web_subscriptions (expire_time);

-- -----------------------------------------------------
-- 3) Referral tables
-- -----------------------------------------------------

create table if not exists public.web_referral_links (
  id uuid primary key default gen_random_uuid(),
  creator_user_id text not null,
  tool_slug text not null,
  share_code text not null,
  source_default text,
  click_count integer not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_web_referral_links_share_code_unique
  on public.web_referral_links (share_code);

create index if not exists idx_web_referral_links_creator_user_id
  on public.web_referral_links (creator_user_id);

create index if not exists idx_web_referral_links_created_at
  on public.web_referral_links (created_at desc);

create table if not exists public.web_referral_clicks (
  id uuid primary key default gen_random_uuid(),
  share_code text not null,
  source text,
  ip_hash text,
  user_agent_hash text,
  landing_path text,
  registered_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_referral_clicks_share_code
  on public.web_referral_clicks (share_code);

create index if not exists idx_web_referral_clicks_registered_user_id
  on public.web_referral_clicks (registered_user_id);

create index if not exists idx_web_referral_clicks_created_at
  on public.web_referral_clicks (created_at desc);

create table if not exists public.web_referral_relations (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id text not null,
  invited_user_id text not null,
  share_code text not null,
  tool_slug text,
  first_tool_id text,
  status text not null default 'bound',
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint chk_web_referral_relations_status check (
    status in ('bound', 'activated', 'invalid')
  )
);

create unique index if not exists idx_web_referral_relations_invited_user_unique
  on public.web_referral_relations (invited_user_id);

create index if not exists idx_web_referral_relations_inviter_user_id
  on public.web_referral_relations (inviter_user_id);

create index if not exists idx_web_referral_relations_created_at
  on public.web_referral_relations (created_at desc);

create table if not exists public.web_referral_rewards (
  id uuid primary key default gen_random_uuid(),
  relation_id uuid,
  user_id text not null,
  reward_type text not null,
  amount integer not null,
  status text not null default 'granted',
  reference_id text not null,
  created_at timestamptz not null default now(),
  granted_at timestamptz,
  constraint chk_web_referral_rewards_amount check (amount > 0),
  constraint chk_web_referral_rewards_status check (
    status in ('pending', 'granted', 'revoked')
  )
);

create unique index if not exists idx_web_referral_rewards_reference_id_unique
  on public.web_referral_rewards (reference_id);

create index if not exists idx_web_referral_rewards_user_id
  on public.web_referral_rewards (user_id);

create index if not exists idx_web_referral_rewards_created_at
  on public.web_referral_rewards (created_at desc);

-- -----------------------------------------------------
-- 4) updated_at triggers
-- -----------------------------------------------------

drop trigger if exists trg_web_referral_links_updated_at on public.web_referral_links;
create trigger trg_web_referral_links_updated_at
before update on public.web_referral_links
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_web_referral_clicks_updated_at on public.web_referral_clicks;
create trigger trg_web_referral_clicks_updated_at
before update on public.web_referral_clicks
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_web_referral_relations_updated_at on public.web_referral_relations;
create trigger trg_web_referral_relations_updated_at
before update on public.web_referral_relations
for each row execute function public.update_updated_at_column();

-- -----------------------------------------------------
-- 5) RLS (service role only)
-- -----------------------------------------------------

alter table public.web_referral_links enable row level security;
alter table public.web_referral_clicks enable row level security;
alter table public.web_referral_relations enable row level security;
alter table public.web_referral_rewards enable row level security;

drop policy if exists p_web_referral_links_service_all on public.web_referral_links;
create policy p_web_referral_links_service_all
  on public.web_referral_links
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists p_web_referral_clicks_service_all on public.web_referral_clicks;
create policy p_web_referral_clicks_service_all
  on public.web_referral_clicks
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists p_web_referral_relations_service_all on public.web_referral_relations;
create policy p_web_referral_relations_service_all
  on public.web_referral_relations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists p_web_referral_rewards_service_all on public.web_referral_rewards;
create policy p_web_referral_rewards_service_all
  on public.web_referral_rewards
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;

-- Verify quickly after run:
-- select * from public.web_referral_links limit 1;
-- select * from public.web_referral_clicks limit 1;
-- select * from public.web_referral_relations limit 1;
-- select * from public.web_referral_rewards limit 1;
