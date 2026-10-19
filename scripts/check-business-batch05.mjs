/**
 * Static integration check for ScheduBrew Business Owner Batch 5.
 * Run from the root of the actual Next.js project. No credentials are read or transmitted.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const root = cwd();
const required = [
  "package.json",
  "app/business/customers/page.tsx",
  "components/business/business-customers.tsx",
  "components/business/customer-loyalty-data.ts",
  "components/business/customers.module.css",
  "components/business/business-dashboard.tsx",
  "components/business/business-orders.tsx",
  "components/business/business-pickup-schedule.tsx",
  "components/business/business-menu.tsx",
  "components/business/dashboard.module.css",
  "components/business/demo-business-data.ts",
  "lib/supabase/server.ts",
];

let failed = 0;
for (const file of required) {
  const ok = existsSync(join(root, file));
  console.log(`${ok ? "PASS" : "FAIL"} ${file}`);
  if (!ok) failed++;
}

for (const file of [
  "components/business/business-dashboard.tsx",
  "components/business/business-orders.tsx",
  "components/business/business-pickup-schedule.tsx",
  "components/business/business-menu.tsx",
]) {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) continue;
  const linked = readFileSync(fullPath, "utf8").includes("/business/customers");
  console.log(`${linked ? "PASS" : "FAIL"} Customers navigation: ${file}`);
  if (!linked) failed++;
}

const pagePath = join(root, "app/business/customers/page.tsx");
if (existsSync(pagePath)) {
  const page = readFileSync(pagePath, "utf8");
  for (const [label, ok] of [
    ["Supabase authentication", page.includes("supabase.auth.getUser()")],
    ["Unauthenticated redirect", page.includes('redirect("/auth/business")')],
    ["Customer page component", page.includes("<BusinessCustomers")],
  ]) {
    console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
    if (!ok) failed++;
  }
}

const componentPath = join(root, "components/business/business-customers.tsx");
if (existsSync(componentPath)) {
  const component = readFileSync(componentPath, "utf8");
  for (const [label, ok] of [
    ["Customer search", component.includes('placeholder="Search customer"')],
    ["Create reward workflow", component.includes("function createReward")],
    ["Points adjustment workflow", component.includes("function adjustPoints")],
    ["Reward redemption workflow", component.includes("function redeemReward")],
    ["Browser-only warning", component.includes("saved only in this browser")],
  ]) {
    console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
    if (!ok) failed++;
  }
}

console.log(`\n${failed === 0 ? "All static Batch 5 checks passed." : `Batch 5 setup needs attention: ${failed} check(s) failed.`}`);
console.log("Next: run npm run build, then npm run dev and open /business/customers.");
if (failed) exit(1);
