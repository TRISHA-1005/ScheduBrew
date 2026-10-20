/** Dependency-free checks for the ScheduBrew frontend wording cleanup. */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const businessFiles = [
  "components/business/business-dashboard.tsx",
  "components/business/business-orders.tsx",
  "components/business/business-pickup-schedule.tsx",
  "components/business/business-menu.tsx",
  "components/business/business-customers.tsx",
  "components/business/business-analytics.tsx",
  "components/business/business-settings.tsx",
  "components/business/business-pickup-label.tsx",
  "components/business/business-shop-details.tsx",
  "app/business/page.tsx",
  "app/business/orders/page.tsx",
  "app/business/pickup-schedule/page.tsx",
  "app/business/menu/page.tsx",
  "app/business/customers/page.tsx",
  "app/business/analytics/page.tsx",
  "app/business/settings/page.tsx",
];
const forbiddenBusinessCopy = [
  /Test mode/i,
  /FRONTEND PREVIEW/i,
  /Frontend Preview/i,
  /frontend prototype/i,
  /frontend demo/i,
  /test workspace/i,
  /test pickup label/i,
  /create a test order/i,
  /reset test menu/i,
  /demo selected/i,
  /demo plan/i,
  /demo shop/i,
  /demo walk-in/i,
  /arrives in Batch/i,
  /will be developed in Business Batch/i,
  /illustrative/i,
  /example pickup/i,
  /example order/i,
  /example capacity/i,
  /No real order will be submitted/i,
];
for (const file of businessFiles) {
  const source = read(file);
  for (const pattern of forbiddenBusinessCopy) {
    assert.equal(pattern.test(source), false, `${file} still contains visible cleanup copy matching ${pattern}`);
  }
}
const customerFiles = [
  "components/customer/checkout-page.tsx",
  "components/customer/checkout-confirmation.tsx",
  "components/customer/customer-orders.tsx",
  "components/customer/customer-rewards.tsx",
  "components/customer/customer-profile.tsx",
  "components/customer/discover.tsx",
  "components/customer/shop-menu.tsx",
  "components/customer/order-tracking.tsx",
];
for (const file of customerFiles) {
  const source = read(file);
  assert.equal(/Test mode:/i.test(source), false, `${file} still contains a Test mode notice`);
}
assert.ok(read("components/customer/checkout-confirmation.tsx").includes("Not sent to shop"), "Checkout confirmation must retain its truthful order delivery status");
assert.ok(read("components/customer/order-tracking.tsx").includes("PICKUP VERIFICATION UNAVAILABLE"), "Pickup tracking must retain its verification status");
for (const file of ["app/customer/page.tsx", "app/business/page.tsx", "components/business/business-dashboard.tsx"]) {
  assert.ok(existsSync(join(root, file)), `${file} should remain in the project`);
}
console.log(`PASS ${businessFiles.length} business owner files checked for removed UI labels`);
console.log(`PASS ${customerFiles.length} customer files checked for Test mode disclaimers`);
console.log("PASS essential order delivery and pickup verification statuses remain visible");
