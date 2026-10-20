# ScheduBrew Account Registration

This update adds separate customer and business owner registration flows to the existing ScheduBrew frontend.

## User flows

- Customer sign in page (`/`) -> Create an account -> `/auth/sign-up?role=customer`
- Business owner sign in page (`/auth/business`) -> Create an account -> `/auth/sign-up?role=business`
- Direct visit to `/auth/sign-up` -> choose Customer or Business owner
- After registration, users with an active Supabase session are routed to the corresponding portal. If email confirmation is required, they see the confirmation instructions and the confirmation link returns to the success page.

## Registration fields

Customer accounts collect full name, email address, mobile number, password, and password confirmation.

Business owner accounts collect shop name, owner/contact name, email address, mobile number, business address, password, and password confirmation.

The form submits to Supabase Auth and stores the submitted profile fields in Auth user metadata. It does not create PostgreSQL profile or shop rows. The profile tables and Row Level Security policies should be designed in the upcoming database phase.

## Apply

1. Back up the existing project.
2. Extract the ZIP into the project root and merge the included folders.
3. Keep your existing root configuration files and environment settings.
4. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are configured in your local environment.
5. Add the deployed and local `/auth/confirm` callback URLs to the allowed redirect URLs in Supabase Authentication settings.
6. Run `node scripts/check-account-registration.mjs`.
7. Run `npm run build` and test both registration flows in a browser.

## Security note

The role written to Auth user metadata is descriptive only. It must not be used by itself to authorize business owner access. When the database phase begins, enforce roles and shop ownership on the server and through PostgreSQL Row Level Security policies.
