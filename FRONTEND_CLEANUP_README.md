# ScheduBrew Frontend Cleanup

This source update removes visible test mode banners, Frontend Preview panels, batch labels, prototype footers, and unnecessary demo wording from the customer and business owner interfaces.

## Included source folders

- `app`
- `components`
- `data`
- `docs`
- `lib`
- `public`
- `scripts`

## Apply the update

1. Back up the current ScheduBrew project.
2. Extract this ZIP into the existing project root, where `package.json` is located.
3. Merge the included folders with the existing folders and allow the cleaned source files to replace matching files.
4. Keep the existing root configuration files and environment settings. Do not share `.env.local` or service role keys.
5. From the project root, run `node scripts/check-frontend-cleanup.mjs`.
6. Run `npm run build`, then test the customer and business owner routes in the browser.

## Scope and backend status

This is a frontend presentation cleanup. It does not connect the application to Supabase or change its existing browser storage behavior. The backend integration should be completed before treating local order, pickup, payment, loyalty, or subscription actions as live transactions. The customer checkout confirmation and pickup verification status remain truthful about the current order state.

The archive contains the source folders listed above, not `node_modules`, local environment secrets, or the root package configuration. Merge it into the existing project rather than using it as a standalone application directory.

## Checks completed for this update

- Frontend cleanup assertions passed.
- Business Batch 7 checks passed.
- Business Batch 8 checks passed.
- TypeScript and TSX syntax parsing passed for 96 source files.
- A full Next.js production build and authenticated browser test were not run because the uploaded source folders did not include the root `package.json`, dependency lockfile, or installed dependencies.
