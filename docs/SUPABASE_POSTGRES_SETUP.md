# ScheduBrew Supabase PostgreSQL Setup

This change establishes the first secure database layer for customer and business-owner accounts. It does not yet replace every browser-local menu, order, analytics, and loyalty screen with live database queries. Those module migrations should be completed one at a time after account authorization is verified.

## What the migration creates

- `public.profiles`: account profile and authoritative account type (`customer` or `business_owner`). Credentials remain in Supabase Auth.
- `public.businesses`: business records linked to the authenticated owner. New business registrations start as `pending_review`.
- `public.business_hours`, `public.business_notification_preferences`, and `public.business_subscriptions`: settings records initialized when a business is created.
- `public.menu_categories` and `public.menu_items`: shop-specific menu data.
- `public.pickup_slots`: pickup windows with capacity tracking.
- `public.orders` and `public.order_items`: order header and immutable price/name snapshots.
- `public.loyalty_accounts` and `public.loyalty_transactions`: per-business customer loyalty records.
- Row Level Security policies, restricted SQL grants, account creation triggers, and the `place_order` database function.

## Before applying

1. Back up your current ScheduBrew project and your Supabase database if it already contains data.
2. Open the correct Supabase project and confirm it is the project used by the current `.env.local` values.
3. Do not paste `.env.local`, passwords, service-role keys, or database connection strings into chat or commit them to source control.
4. If you already created tables with these names, inspect them first. This migration is intended as the initial ScheduBrew schema and does not automatically reconcile a different pre-existing schema.

## Apply the migration in Supabase

1. Open Supabase Dashboard and select the ScheduBrew project.
2. Open **SQL Editor** and create a new query.
3. Copy the entire contents of `supabase/migrations/202610200001_initial_schedu_brew_schema.sql` into the editor.
4. Review it, then run it once. Do not run it against a production database before reviewing the existing schema and backing up data.
5. In **Authentication → URL Configuration**, set the Site URL to your local app URL while testing, usually `http://localhost:3000`.
6. Add the local confirmation redirect `http://localhost:3000/auth/confirm` to the allowed redirect URLs. Add your deployed domain's corresponding `/auth/confirm` URL when deploying.
7. Confirm `.env.local` contains the existing expected variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use the publishable key only in the browser. Never expose a Supabase service-role or secret key in `NEXT_PUBLIC_*` variables.

## How account registration works

- The registration form calls Supabase Auth `signUp`.
- The form sends `account_type`, name, phone, and, for a business owner, shop name and address as signup metadata.
- The `auth.users` database trigger validates the requested account type and creates the protected `public.profiles` row. A business-owner signup also creates a `public.businesses` row and default settings.
- The metadata is not the authorization source. The protected `profiles.account_type` column is authoritative, and users cannot update that column through the client.
- Business-owner registration creates a business with status `pending_review`. A privileged administrator must review and activate it before it appears in the customer-facing active business list. Business owners cannot set their own status.
- Login checks the PostgreSQL profile account type. A customer account cannot sign in to the owner portal and an owner account cannot sign in to the customer portal.
- Server layouts enforce the portal account type, and RLS policies independently enforce row access in the database.

## Verify the setup

Run these read-only queries in the SQL Editor:

```sql
select id, account_type, full_name, created_at
from public.profiles
order by created_at desc
limit 20;

select id, owner_id, name, status, created_at
from public.businesses
order by created_at desc
limit 20;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'businesses', 'business_hours', 'business_notification_preferences',
    'business_subscriptions', 'menu_categories', 'menu_items', 'pickup_slots',
    'orders', 'order_items', 'loyalty_accounts', 'loyalty_transactions'
  )
order by tablename;
```

Then run the app locally and test both registration paths with separate email addresses:

1. Register a customer, confirm the email if required, and sign in through Customer Sign In.
2. Register a business owner with a shop name and address, confirm the email if required, and sign in through Business Owner Sign In.
3. Try each account on the opposite login page. The login must reject the wrong portal and sign out.
4. Check `profiles` and `businesses` in SQL Editor. The customer should have a customer profile; the business owner should have a business profile and a business with `pending_review` status.

## Activating a business after review

Business status changes are intentionally not granted to business owners. After verifying a business, a trusted administrator can activate it in the Supabase SQL Editor using its exact UUID:

```sql
update public.businesses
set status = 'active'
where id = 'REPLACE_WITH_BUSINESS_UUID'
  and status = 'pending_review';
```

Only use this privileged query after reviewing the business. Do not add this operation to the public client.

## Important current limitation

The schema and account access controls are installed by this migration, and the signup/login path uses the new profile role. Existing module components still include local-storage/sample-data workflows. Menu, orders, pickup schedules, settings, and loyalty screens must be connected to the corresponding tables and tested individually before treating the full product as live. The `place_order` function is provided as the secure order-creation entry point for that next phase; do not insert order totals or order items directly from the browser.

The subscription table is a record of plan/status only. No payment processing is implemented.
