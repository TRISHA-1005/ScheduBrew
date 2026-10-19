/**
 * Static integration check for ScheduBrew Business Owner Batch 6.
 * Run from the root of the actual Next.js project. No credentials are read or transmitted.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const root = cwd();

// Batch 7 replaces fixed example totals with calculated reporting.
if (existsSync(join(root, "components/business/analytics-report.ts"))) {
  console.log("Batch 7 reporting is installed. Running the current analytics checks.");
  await import("./check-business-batch07.mjs");
  process.exit(0);
}
const required = [
  "package.json",
  "app/business/analytics/page.tsx",
  "components/business/business-analytics.tsx",
  "components/business/analytics-demo-data.ts",
  "components/business/analytics.module.css",
  "components/business/business-dashboard.tsx",
  "components/business/business-orders.tsx",
  "components/business/business-pickup-schedule.tsx",
  "components/business/business-menu.tsx",
  "components/business/business-customers.tsx",
  "components/business/dashboard.module.css",
  "components/business/demo-business-data.ts",
  "components/business/menu-demo-data.ts",
  "components/business/customer-loyalty-data.ts",
  "lib/supabase/server.ts",
];

let failed = 0;
function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed++;
}

for (const file of required) check(file, existsSync(join(root, file)));

for (const file of [
  "components/business/business-dashboard.tsx",
  "components/business/business-orders.tsx",
  "components/business/business-pickup-schedule.tsx",
  "components/business/business-menu.tsx",
  "components/business/business-customers.tsx",
]) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  const source = readFileSync(path, "utf8");
  const linked = file.endsWith("business-dashboard.tsx")
    ? source.includes("item.batch === 6") && source.includes("/business/analytics")
    : source.includes('href: "/business/analytics", batch: 6');
  check(`Analytics navigation: ${file}`, linked);
}

const pagePath = join(root, "app/business/analytics/page.tsx");
if (existsSync(pagePath)) {
  const page = readFileSync(pagePath, "utf8");
  check("Supabase authentication guard", page.includes("supabase.auth.getUser()"));
  check("Unauthenticated redirect", page.includes('redirect("/auth/business")'));
  check("Analytics page component", page.includes("<BusinessAnalytics"));
}

const componentPath = join(root, "components/business/business-analytics.tsx");
if (existsSync(componentPath)) {
  const component = readFileSync(componentPath, "utf8");
  check("Report period selector", component.includes("Choose analytics report period"));
  check("Daily, weekly and monthly chart views", component.includes("TREND_VIEWS.map"));
  check("Pickup heatmap interaction", component.includes("setSelectedHeatCell"));
  check("CSV report export", component.includes("safeDownloadReport"));
  check("Browser test order activity integration", component.includes("readLocalOrderActivity()"));
  check("Analytics navigation active", component.includes("batch === 6 ? shell.sideActive"));
}

const dataPath = join(root, "components/business/analytics-demo-data.ts");
if (existsSync(dataPath)) {
  const data = readFileSync(dataPath, "utf8");
  check("Proposal KPI examples", data.includes("grossSales: 286400") && data.includes("orders: 2940"));
  check("Top products sample data", data.includes("Caramel Macchiato") && data.includes("Iced Spanish Latte"));
}

console.log(`\n${failed === 0 ? "All static Batch 6 checks passed." : `Batch 6 setup needs attention: ${failed} check(s) failed.`}`);
console.log("Next: run npm run build, then npm run dev and open /business/analytics.");
if (failed) exit(1);
