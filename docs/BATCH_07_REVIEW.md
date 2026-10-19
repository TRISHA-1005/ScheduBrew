# Batch 7 review and acceptance checklist

## Source review

The supplied archives contain 36 app files, 66 component files, four library helper files, and six scripts before this update. Binary icons and images were inventoried; the review concentrated on routes, authentication, business state, report calculations, shared helpers, and integration checks.

| Area | Finding | Batch 7 response |
| --- | --- | --- |
| `app/business/analytics/page.tsx` | Analytics already exists and authenticates with Supabase. | Preserve the route and authentication guard; update the description. |
| Business components | Dashboard and Orders share browser orders and status keys. New orders previously had no creation timestamp. | Record and preserve optional creation timestamps in both creation flows. |
| Existing analytics | Fixed KPIs were scaled by preset factors. Chart, product and heatmap figures used separate fixed datasets. Local orders were added without date filtering. | Use one calculated report object for the visible metrics, chart, tables and CSV. |
| Pickup data | Owner order records have pickup time text, but no pickup date or actual collection timestamp. | Label pickup analysis as preferences using creation weekday. Remove unsupported punctuality claims. |
| Customer and loyalty data | Separate browser customer summaries have no reliable order identity relationship. | Do not infer identities from names or join unrelated sample totals. |
| Customer checkout | Uses separate customer storage and imports `data/schedu-mock`, which was not supplied. | Leave customer checkout and its data unchanged. |
| `lib/supabase` | Provides authentication and session helpers. No business data queries or schema are present in these archives. | Preserve all helpers. Do not invent database tables or migrate production data. |
| `scripts` | Existing scripts are primarily file and string checks, not database migrations. Batch 6 expects the old fixed figures. | Add calculation and integration tests; route the Batch 6 checker to them when Batch 7 is installed. |
| Business navigation | Analytics is already linked. Settings placeholders name Batch 7. | Preserve links and update Settings placeholders to Batch 8. |

No business authorization model, live merchant data, payment integration, subscription handling or database schema was introduced. Those require separate work against the actual data model. The existing Supabase sign in guard does not establish merchant or branch authorization. The visible test mode labels remain necessary.

## File responsibilities

| File | Purpose |
| --- | --- |
| `components/business/analytics-report.ts` | Pure date validation, fixtures, aggregation, comparison and CSV calculations. |
| `components/business/analytics-local-data.ts` | Converts existing local owner orders into report records without inventing dates or customer identities. |
| `components/business/business-analytics.tsx` | Report controls, rendering, downloads, refresh, printing and pagination. |
| `components/business/analytics.module.css` | Existing visual theme plus report controls, responsive rules and print styles. |
| `components/business/demo-business-data.ts` | Preserves optional timestamps, rejects negative prices, emits browser change events. |
| `components/business/business-dashboard.tsx` | Timestamps newly created walk in orders; Settings placeholder corrected. |
| `components/business/business-orders.tsx` | Timestamps newly created walk in orders; Settings placeholder corrected. |
| `components/business/business-menu.tsx` | Settings placeholder corrected only. |
| `components/business/business-customers.tsx` | Settings placeholder corrected only. |
| `components/business/business-pickup-schedule.tsx` | Settings placeholder corrected only. |
| `app/business/analytics/page.tsx` | Report metadata updated; authentication unchanged. |
| `scripts/check-business-batch07.mjs` | Seventeen reproducible behavior and integration checks using the project's existing TypeScript dependency. |
| `scripts/check-business-batch06.mjs` | Uses current analytics checks when Batch 7 is present; retains legacy checks otherwise. |

The old `analytics-demo-data.ts` file remains for compatibility but the updated page does not import it. No existing file needs deletion.

## Browser acceptance checks

These checks are pending in your complete project. Use demo data only.

1. Build, then sign out and open `/business/analytics`. Confirm the existing redirect to business sign in.
2. Sign in and open Analytics. Confirm the sample data banner and Batch 7 label.
3. Change Last 30 days to Last 7 days. Confirm the date range, totals, chart, products and order list update together.
4. Compare Daily, Weekly and Monthly. The exact trend values must sum to the same report totals. Inspect the zero baseline and currency or order axis label.
5. Choose Custom. Try a reversed range, a future end date, and a range longer than 366 days. Confirm the error message and disabled export and print controls.
6. Select an empty date range or Local demo orders with no saved orders. Confirm zero totals, an empty state, and no invented customer or growth figures.
7. Create a new walk in order in Dashboard. In Local demo orders, confirm the order count increases while collected value remains zero for a queued order.
8. Move that order through Preparing and Ready to Collected. Return to Analytics or click Refresh. Confirm its recorded value appears exactly once in collected totals and product totals.
9. Create an order through Orders and repeat the check. Cancel another queued order. Confirm cancellation count increases and collected value does not.
10. If older local orders exist, confirm the excluded undated count and that the old orders remain visible in Orders.
11. Export Summary, All filtered orders and Collected products. Check the date, source, status, time zone, definitions and matching values. Order CSV must include all pages and omit customer names and contact details.
12. Use Print report and Save as PDF. Confirm the summary contains filters and definitions, while navigation, action buttons and paginated order details are hidden. Exact trend values and full order details are available in CSV.
13. At approximately 390 pixels wide, check filters, tables and menu controls. Tables may scroll within their containers; the whole page should not scroll horizontally. Open the navigation and close it with Escape.
14. Use keyboard Tab to reach filters, chart controls, table details, export, print, heatmap cells and pagination. Confirm visible focus and descriptive accessible names.
15. Change a local order in another tab and return to Analytics. Confirm the report refreshes. Reload the page and verify creation dates and status changes persist.
16. Check the existing Dashboard, Orders, Menu, Pickup Schedule and Customers pages. Settings should indicate Batch 8, without opening an unfinished settings screen.

## Remaining project work

The Dashboard still contains its own illustrative headline totals. The customer checkout and owner workflows still use separate demo stores. These are existing project limitations, not a shared live order system. Batch 7 provides consistent calculations within Analytics. Cross application data integration belongs in the later integration work.

The customer routes cannot be fully validated from these uploads without the original `data` folder. Missing images in `public` also prevent a complete visual review of the other modules.
