# Schedubrew Batch 7: Analytics and Reports

This is an update package for the source archives supplied on October 19, 2026. It contains only new or changed files. Extracting and merging its contents into your project updates the existing `/business/analytics` page.

## Install

1. Stop your development server and make a backup of your current project.
2. Extract this ZIP to a temporary folder.
3. Copy `app`, `components`, `scripts`, `docs`, and this README into your project root, beside `package.json`.
4. Merge the folders and replace matching files. Keep all other existing files. Do not delete your existing folders.
5. Run these commands from your project root:

```bash
node scripts/check-business-batch07.mjs
npm run build
npm run dev
```

If dependencies are not installed, run `npm ci` first. Batch 7 adds no dependencies and does not replace your package files or environment configuration.

6. Sign in using the existing business sign in page and open `/business/analytics`.

No SQL migration or Supabase configuration change is required. These reports operate on the existing browser demo architecture. They are not live financial or merchant database reports.

## Included features

* Separate sample history and local browser order sources.
* Presets for 7, 30 and 90 days, the current year, and custom dates.
* Inclusive Manila calendar dates, maximum 366 days, and date validation.
* Status filters applied consistently to current and previous periods.
* Collected order value, order counts, average collected order value, and cancellation rate.
* Previous period comparisons using an equal number of calendar days.
* Daily, weekly and monthly chart buckets, selectable value or order count, and an exact values table.
* Collected product rankings, status totals, and pickup preference counts covering all seven days and all hours.
* Repeat customer rate for sample records with stable customer IDs.
* Detailed order table with pagination.
* Summary, all filtered orders, and product CSV exports. Order export includes every page.
* Printable summary suitable for the browser's Save as PDF option.
* Empty states, invalid date messages, and local storage error handling.
* Creation timestamps for new walk in orders entered through Dashboard or Orders.
* Settings placeholders now identify Batch 8.

## Understand the data

Sample history is a deterministic illustrative dataset covering 732 calendar days ending today. It is separate from the original queue examples and local walk in orders. Comparisons for custom dates before the sample coverage may be incomplete; the screen identifies the available coverage.

Local reports contain dated walk in orders saved under the existing business order storage key. They do not include customer checkout orders, the fixed `EX` queue examples, or a database order table. Browser history retains at most 100 local orders and may be reset using the existing business screens. Reports follow that retained history.

Orders saved before Batch 7 have no trustworthy creation date. They remain available in the existing order screens, but dated reports exclude them and show their count. Existing orders are not silently assigned today's date. New creation timestamps survive subsequent status changes.

Collected order value is the recorded unit price multiplied by quantity, for collected orders only. It is grouped by creation date. It does not verify payment, account for discounts, refunds or taxes, or measure the actual collection date. Changing an order's current status changes its report contribution.

Order counts and cancellation rate use all statuses selected by the filter. A cancellation only selection will therefore have a 100% cancellation rate when it contains orders. Empty selections display zero totals.

Pickup demand uses order creation weekday and the recorded pickup hour because owner orders do not store a separate pickup date or actual pickup time. It measures preferences, not punctuality or capacity. The screen groups hours into four hour cells; summary CSV preserves hourly counts.

Repeat customer rate is the share of identified customers with at least two collected orders within the selected period. Local display names are not treated as customer IDs. This metric is unavailable for local orders. The former fixed on time rate and retention percentage were removed because the source data cannot support those measurements.

## Verification

Completed in this environment:

* All 17 behavior and integration checks in `check-business-batch07.mjs` passed.
* The Batch 6 checker successfully delegates to the updated analytics checks.
* Existing Batch 3 and Batch 5 integration checks passed.
* Scoped TypeScript checking passed for all changed business components and reporting modules, using TypeScript 5.9.3 with cached React 19 and Next.js declarations. The unchanged Logout boundary used a matching declaration.
* The reporting component and CSS successfully bundled with esbuild in an isolated harness. The harness substitutes navigation and sign out and is not included in this update.
* ZIP paths, file hashes, and changed file contents were checked before delivery.

Not completed here:

* A full build using your exact locked dependencies. Network restrictions blocked `npm ci`; cached validation dependencies differ from your lockfile in some versions.
* Full customer application checking. `data/schedu-mock` and `public` were not supplied in the four archives.
* Authenticated browser behavior, visual layout and print preview. The browser executable was unavailable. Please use the checklist in `docs/BATCH_07_REVIEW.md` after merging.

Do not replace your existing `data` or `public` directories. They are outside this update.

## Rollback

Stop the server. Restore the overwritten files from your backup, then remove only the newly added files listed in `docs/BATCH_07_MANIFEST.json`. Your existing local orders do not need to be cleared. Earlier code ignores the optional creation timestamp field.

Batch 8, Business Settings and Subscription, and Batch 9, Final Integration and Quality Assurance, are not implemented in this package.
