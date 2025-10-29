# SiteHub Payment Template (Stripe + PayPal)

This bundle captures the complete Stripe and PayPal implementation from the SiteHub web app so it can be dropped into another Next.js 14 project with minimal wiring.

## Folder Contents

```
app/payment/page.tsx                     # Pricing UI + checkout triggers
app/payment/success/page.tsx             # Success screen
app/payment/cancel/page.tsx              # Cancel screen
app/api/payment/stripe/create/route.ts   # Stripe Checkout session creation
app/api/payment/stripe/webhook/route.ts  # Stripe webhook handler
app/api/payment/paypal/create/route.ts   # PayPal order creation
app/api/payment/paypal/capture/route.ts  # PayPal capture + Supabase sync
```

Copy these folders into the target project keeping the same structure. All imports are relative to the project root.

## Required Environment Variables

Set the following keys (use `.env.local` in development and the platform’s secret manager in production):

| Key | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Base URL used for success/cancel redirects (e.g. `https://yourdomain.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used server-side in webhook/capture) |
| `STRIPE_SECRET_KEY` | Secret key from Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret for the deployed endpoint |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal REST client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal REST client secret |
| `PAYPAL_MODE` | `sandbox` or `production` |

## Stripe Wiring

1. Create products/prices or keep the inline price settings in `app/api/payment/stripe/create/route.ts`.
2. Configure the webhook endpoint to point to `/api/payment/stripe/webhook`. Add events:
   - `checkout.session.completed`
3. Update `NEXT_PUBLIC_SITE_URL` to the domain that hosts `/payment/success` and `/payment/cancel`.
4. Ensure Supabase has a `subscriptions` table with columns matching the upsert payload (`user_email`, `platform`, `payment_method`, `plan_type`, `billing_cycle`, `status`, `start_time`, `expire_time`, `stripe_session_id`, `updated_at`).

## PayPal Wiring

1. Generate REST credentials in the PayPal Developer dashboard (sandbox or live).
2. `app/api/payment/paypal/create/route.ts` creates the order and returns `approvalUrl`.
3. `app/api/payment/paypal/capture/route.ts` finalizes payment and writes to Supabase in the same `subscriptions` table.
4. Front-end logic (see `app/payment/page.tsx`) stores capture metadata in `localStorage` so the success page can complete the capture request after the redirect.

## How to Integrate

1. Install dependencies:
   ```bash
   pnpm add stripe @paypal/paypal-server-sdk @supabase/supabase-js
   ```
2. Copy the folders in this bundle into your project.
3. Add a Supabase client helper similar to `lib/supabase/client.ts` (or adapt imports to your existing helper).
4. Add authentication context if you need `user` data for the pricing page. Otherwise adjust `app/payment/page.tsx` to fit your auth flow.
5. Configure environment variables locally and on the hosting platform.
6. Run `pnpm dev`, visit `/payment`, and complete test payments:
   - Stripe: use the 4242-4242-4242-4242 test card with any future expiry/CVC.
   - PayPal: log in with a sandbox buyer account.
7. Confirm Supabase receives subscription rows with the expected metadata.

## Notes

- Prices are coded directly in the API routes; adjust amounts or fetch from a CMS if needed.
- `app/payment/page.tsx` also toggles Alipay UI state—remove if not required.
- Webhook/capture handlers expect `userEmail`, `planType`, and `billingCycle` values passed from the front-end so keep those fields intact when refactoring the UI.
