/** Dependency-free structural sanity check. Run from the Next.js project root:
 *     node scripts/check-customer-frontend.mjs
 * This does not replace npm run build or manual browser testing.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const required = [
  ["app/page.tsx", "Customer login homepage"],
  ["app/customer/page.tsx", "Discover Shops route"],
  ["app/customer/shops/[shopId]/page.tsx", "Shop Menu route"],
  ["app/customer/cart/page.tsx", "Cart route"],
  ["app/customer/checkout/page.tsx", "Checkout route"],
  ["app/customer/checkout/confirmation/page.tsx", "Confirmation route"],
  ["app/customer/orders/page.tsx", "My Orders route"],
  ["app/customer/orders/[orderId]/page.tsx", "Order Tracking route"],
  ["app/customer/profile/page.tsx", "Profile route"],
  ["app/customer/rewards/page.tsx", "Rewards route"],
  ["app/customer/qa/page.tsx", "Manual QA page"],
  ["app/customer/error.tsx", "Customer error UI"],
  ["app/customer/layout.tsx", "Customer page metadata"],
  ["components/customer/customer-nav.tsx", "Customer navigation"],
  ["components/customer/customer.module.css", "Customer responsive styles"],
  ["components/customer/checkout-page.tsx", "Checkout component"],
  ["components/customer/cart-checkout.module.css", "Checkout responsive styling"],
  ["components/customer/demo-order-data.ts", "Demo cart/order data"],
  ["components/customer/order-tracking.tsx", "Demo order tracking"],
  ["components/customer/customer-profile.tsx", "Customer profile"],
  ["components/customer/customer-rewards.tsx", "Rewards preview"],
  ["components/customer/customer-qa.tsx", "Manual testing interface"],
  ["public/schedu/logo.png", "ScheduBrew logo"],
  ["package.json", "Next.js project root"],
];

let failures = 0;
for (const [file, label] of required) {
  const ok = existsSync(join(process.cwd(), file));
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  (${file})`);
  if (!ok) failures++;
}

const checkoutStyles = join(process.cwd(), "components/customer/cart-checkout.module.css");
if (existsSync(checkoutStyles)) {
  const styles = readFileSync(checkoutStyles, "utf8");
  const preservesFix = styles.includes(".checkoutFormScroll") && styles.includes(".checkoutSide") && styles.includes(".checkoutBenefits");
  console.log(`${preservesFix ? "PASS" : "FAIL"}  Batch 3 independent checkout scroll fix markers`);
  if (!preservesFix) failures++;
}

if (failures) {
  console.error(`\n${failures} check(s) failed. Verify you copied Batch 6 into the INNER schedu-brew folder, then check earlier batches.`);
  process.exitCode = 1;
} else {
  console.log("\nStructure check passed. Next: npm run build, then test all pages manually at localhost:3000/customer/qa.");
}
