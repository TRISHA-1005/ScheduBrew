import fs from "node:fs";
import path from "node:path";
const list = [
  "app/business/pickup-schedule/page.tsx",
  "components/business/business-pickup-schedule.tsx",
  "components/business/pickup-demo-data.ts",
  "components/business/pickup-schedule.module.css",
  "components/business/business-dashboard.tsx",
  "components/business/business-orders.tsx",
  "components/business/dashboard.module.css",
  "components/business/demo-business-data.ts",
  "package.json",
];
let passed = true;
for (const file of list) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${exists ? "OK" : "MISSING"} ${file}`);
  if (!exists) passed = false;
}
const dashboard = fs.readFileSync(path.join(process.cwd(), "components/business/business-dashboard.tsx"), "utf8");
const orders = fs.readFileSync(path.join(process.cwd(), "components/business/business-orders.tsx"), "utf8");
if (!dashboard.includes('"/business/pickup-schedule"') || !orders.includes('href: "/business/pickup-schedule"')) {
  console.error("Sidebar navigation is not fully updated"); passed = false;
}
console.log(passed ? "Business Batch 3 file checks passed." : "Some checks failed. Recopy Batch 3 files.");
process.exitCode = passed ? 0 : 1;
