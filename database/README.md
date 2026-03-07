# Database SQL Layout

This project keeps SQL files in one place to avoid root-level scatter.

## Folders

- `migrations/intl/`
  - Canonical SQL migrations for international deployment (Supabase).
  - Run in chronological order.

- `legacy/intl/`
  - Archived old SQL docs/scripts kept only for historical reference.
  - Do not execute directly in new environments unless reviewed.

## Current migration entry

- `migrations/intl/20260307_0001_market_referral_membership.sql`
  - Adds market referral tables.
  - Adds web_users referral fields.
  - Ensures web_subscriptions supports `on conflict (user_email)` for membership-day rewards.
