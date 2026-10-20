/** Run from the project root: node scripts/check-business-batch08.mjs */
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);
let ts;
try { ts = require("typescript"); }
catch { console.error("TypeScript is required. Run npm ci in the project root, then rerun this check."); process.exit(1); }
const temporary = mkdtempSync(join(tmpdir(), "schedubrew-batch08-"));
let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
try {
  for (const name of ["demo-business-data", "business-settings-data"]) {
    const input = readFileSync(join(root, "components/business", `${name}.ts`), "utf8");
    const output = ts.transpileModule(input, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      reportDiagnostics: true,
    });
    assert.equal(output.diagnostics?.length || 0, 0, `${name} should transpile without diagnostics`);
    writeFileSync(join(temporary, `${name}.js`), output.outputText);
  }
  const settings = require(join(temporary, "business-settings-data.js"));
  const defaults = settings.DEFAULT_BUSINESS_SETTINGS;

  check("Default sample hours include the existing 3 PM and 4 PM pickup windows", () => {
    assert.equal(settings.isPickupSlotWithinHours("2026-10-20", "3:00", defaults.operatingHours), true);
    assert.equal(settings.isPickupSlotWithinHours("2026-10-20", "4:20", defaults.operatingHours), true);
    assert.equal(settings.isPickupSlotWithinHours("2026-10-20", "3:00 PM", defaults.operatingHours), true);
  });
  check("Closed days and times outside opening hours are unavailable", () => {
    const closed = { ...defaults.operatingHours, monday: { ...defaults.operatingHours.monday, closed: true } };
    assert.equal(settings.isPickupSlotWithinHours("2026-10-19", "3:00", closed), false);
    const earlyClose = { ...defaults.operatingHours, tuesday: { closed: false, open: "07:00", close: "15:00" } };
    assert.equal(settings.isPickupSlotWithinHours("2026-10-20", "3:00", earlyClose), false);
    assert.equal(settings.isPickupSlotWithinHours("2026-10-20", "2:40", earlyClose), true);
    assert.equal(settings.isPickupSlotWithinHours("2026-10-20", "not a time", defaults.operatingHours), false);
  });
  check("Malformed stored values normalize to supported plan and operating hour shapes", () => {
    const value = settings.normalizeBusinessSettings({
      profile: { businessName: "Cafe" },
      operatingHours: { monday: { closed: false, open: "25:00", close: "07:00" } },
      notifications: { weeklySummary: true },
      subscription: { plan: "Enterprise", updatedAt: "invalid" },
    });
    assert.equal(value.profile.businessName, "Cafe");
    assert.equal(value.profile.branchName, defaults.profile.branchName);
    assert.equal(value.operatingHours.monday.open, defaults.operatingHours.monday.open);
    assert.equal(value.subscription.plan, "Starter");
    assert.equal(value.subscription.updatedAt, null);
    assert.equal(value.notifications.weeklySummary, true);
  });
  check("Business settings persist through the existing browser storage helper", () => {
    const data = new Map();
    let events = 0;
    globalThis.window = {
      localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
      dispatchEvent: () => { events++; },
    };
    const next = settings.normalizeBusinessSettings({ ...defaults, profile: { ...defaults.profile, businessName: "Test Cafe" } });
    assert.equal(settings.writeBusinessSettings(next), true);
    assert.equal(settings.readBusinessSettings().profile.businessName, "Test Cafe");
    assert.equal(events, 1);
    delete globalThis.window;
  });
  check("Settings route retains the business authentication guard", () => {
    const page = readFileSync(resolve(root, "app/business/settings/page.tsx"), "utf8");
    assert.ok(page.includes("supabase.auth.getUser()"));
    assert.ok(page.includes('redirect("/auth/business")'));
    assert.ok(page.includes("BusinessSettings"));
  });
  check("Settings navigation is linked from all six existing owner modules", () => {
    for (const file of ["business-dashboard.tsx", "business-orders.tsx", "business-pickup-schedule.tsx", "business-menu.tsx", "business-customers.tsx", "business-analytics.tsx"]) {
      const source = readFileSync(join(root, "components/business", file), "utf8");
      assert.ok(source.includes("/business/settings"), `${file} should link to settings`);
      assert.ok(source.includes("BusinessShopDetails"), `${file} should render the saved business details`);
    }
  });
  check("Pickup Schedule responds to saved operating hours and marks unavailable windows", () => {
    const source = readFileSync(resolve(root, "components/business/business-pickup-schedule.tsx"), "utf8");
    assert.ok(source.includes("isPickupSlotWithinHours"));
    assert.ok(source.includes("getBusinessHoursForDate"));
    assert.ok(source.includes("BUSINESS_CHANGED_EVENT"));
    assert.ok(source.includes("Unavailable: {row.blockedReason}"));
    assert.ok(source.includes("outsideOperatingHours"));
  });
  check("Subscription controls remain a demo and do not request payment details", () => {
    const source = readFileSync(resolve(root, "components/business/business-settings.tsx"), "utf8");
    assert.ok(source.includes("No payment details were collected"));
    assert.ok(source.includes("no charge was made"));
    assert.ok(source.includes("Choose ${plan.name}"));
    assert.ok(!source.toLowerCase().includes("card number"));
  });
  check("New settings styles and data modules are included", () => {
    for (const file of [
      "components/business/business-settings-data.ts",
      "components/business/business-shop-details.tsx",
      "components/business/business-settings.tsx",
      "components/business/settings.module.css",
      "app/business/settings/page.tsx",
    ]) assert.ok(existsSync(resolve(root, file)), `${file} should exist`);
  });
  console.log(`\n${passed} Batch 8 checks passed. Run npm run build and verify the authenticated page in a browser after merging.`);
} finally {
  delete globalThis.window;
  rmSync(temporary, { recursive: true, force: true });
}
