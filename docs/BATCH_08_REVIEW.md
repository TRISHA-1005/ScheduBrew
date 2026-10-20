# Batch 8 review checklist

## Install and route

- [ ] Merge the Batch 8 ZIP into a backup copy of the current project.
- [ ] Run `node scripts/check-business-batch08.mjs`.
- [ ] Run `npm run build` and resolve any environment-specific errors.
- [ ] Sign in through `/auth/business` and open `/business/settings`.
- [ ] Confirm Settings is linked from Dashboard, Orders, Pickup Schedule, Menu, Customers, and Analytics.

## Business profile

- [ ] Update the business name, branch name, contact email, phone, address, city, region, postal code, and description.
- [ ] Try saving with the business name, branch name, or city blank.
- [ ] Try saving an invalid contact email.
- [ ] Save valid details and confirm the page header updates across the business modules.
- [ ] Refresh the browser and confirm the saved values remain in that browser.

## Operating hours and Pickup Schedule

- [ ] Change a weekday closing time to an earlier time and save.
- [ ] Open Pickup Schedule for that weekday and confirm later windows are marked unavailable.
- [ ] Mark a day closed and confirm its windows are marked unavailable.
- [ ] Restore opening hours and confirm the windows become available again.
- [ ] Confirm unavailable windows cannot be manually unblocked or capacity edited as if they were ordinary open windows.
- [ ] Check week view and confirm days reflect their saved hours.

## Notifications and subscription

- [ ] Toggle each notification preference, save, and refresh.
- [ ] Select Growth or Pro and confirm the selected plan updates.
- [ ] Confirm plan selection does not request payment details or claim a real payment was made.
- [ ] Reset sample settings and confirm the profile, hours, notification preferences, and plan return to defaults.

## Responsive and regression checks

- [ ] Check the Settings page at desktop and mobile widths.
- [ ] Confirm Dashboard, Orders, Pickup Schedule, Menu, Customers, and Analytics still load.
- [ ] Confirm the existing sample order queue and customer demo data remain intact.
- [ ] Confirm no database migration or environment variable change is required for this frontend batch.
