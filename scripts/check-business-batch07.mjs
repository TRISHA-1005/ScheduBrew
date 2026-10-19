/** Run from the project root: node scripts/check-business-batch07.mjs */
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
const temporary = mkdtempSync(join(tmpdir(), "schedubrew-batch07-"));
let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
try {
  for (const name of ["analytics-report", "analytics-local-data", "demo-business-data"]) {
    const input = readFileSync(join(root, "components/business", name + ".ts"), "utf8");
    const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, reportDiagnostics: true });
    assert.equal(output.diagnostics?.length || 0, 0);
    writeFileSync(join(temporary, name + ".js"), output.outputText);
  }
  const r = require(join(temporary, "analytics-report.js"));
  const adapter = require(join(temporary, "analytics-local-data.js"));
  const storage = require(join(temporary, "demo-business-data.js"));
  const filters = { start: "2026-10-01", end: "2026-10-07", source: "local", status: "all", interval: "Daily" };
  const order = (id, overrides = {}) => ({ id, date: "2026-10-01", product: "Latte", quantity: 2, unitPriceCents: 15500, status: "collected", source: "local", pickupHour: 15, customerId: "C1", ...overrides });
  const input = [order("A"), order("B", { date: "2026-10-07", quantity: 1 }), order("C", { status: "cancelled" }), order("D", { status: "queued" }), order("E", { date: "2026-09-30", quantity: 1 }), order("F", { date: "2026-10-08" }), order("S", { source: "sample" })];
  const report = r.buildReport(input, filters);
  check("Inclusive date boundaries, source isolation and previous period", () => {
    assert.equal(report.totals.orders, 4); assert.equal(report.previousTotals.orders, 1);
    assert.deepEqual(report.previous, { start: "2026-09-24", end: "2026-09-30" });
  });
  check("Only collected orders contribute value and average", () => {
    assert.equal(report.totals.valueCents, 46500); assert.equal(report.totals.averageCents, 23250);
    assert.equal(report.totals.collected, 2); assert.equal(report.totals.cancellationRate, 25);
    assert.equal(report.salesChange, 200);
  });
  check("Daily, weekly and monthly totals reconcile", () => {
    for (const interval of r.TREND_VIEWS) {
      const result = r.buildReport(input, { ...filters, interval });
      assert.equal(result.buckets.reduce((n,b) => n + b.valueCents, 0), result.totals.valueCents);
      assert.equal(result.buckets.reduce((n,b) => n + b.orders, 0), result.totals.orders);
      assert.equal(result.products.reduce((n,p) => n + p.valueCents, 0), result.totals.valueCents);
      assert.equal(Object.values(result.statuses).reduce((a,b) => a+b, 0), result.totals.orders);
    }
  });
  check("Status filter applies to both periods and all report sections", () => {
    const result = r.buildReport(input, { ...filters, status: "cancelled" });
    assert.equal(result.totals.orders, 1); assert.equal(result.totals.valueCents, 0);
    assert.equal(result.previousTotals.orders, 0); assert.equal(result.products.length, 0);
    assert.equal(result.heatmap.flat().reduce((a,b) => a+b, 0), 0);
  });
  check("Empty ranges and zero comparison denominators", () => {
    const result = r.buildReport([], filters);
    assert.equal(result.totals.orders, 0); assert.equal(result.totals.averageCents, 0);
    assert.equal(result.repeatRate, null); assert.equal(result.buckets.length, 7);
    assert.equal(r.percentageChange(0,0), 0); assert.equal(r.percentageChange(10,0), null);
    assert.equal(r.percentageChange(0,10), -100);
  });
  check("Manila midnight boundaries independent of machine timezone", () => {
    assert.equal(r.manilaDate("2026-10-01T15:59:59Z"), "2026-10-01");
    assert.equal(r.manilaDate("2026-10-01T16:00:00Z"), "2026-10-02");
  });
  check("Range validation, leap days, year boundaries and maximum range", () => {
    assert.equal(r.isDateKey("2024-02-29"), true); assert.equal(r.isDateKey("2026-02-29"), false);
    assert.equal(r.isDateKey("2026-02-30"), false);
    assert.ok(r.validateRange({ start: "2026-10-08", end: "2026-10-01" }, "2026-10-19"));
    assert.ok(r.validateRange({ start: "2026-10-01", end: "2026-10-20" }, "2026-10-19"));
    assert.ok(r.validateRange({ start: "2025-01-01", end: "2026-01-02" }, "2026-10-19"));
    assert.equal(r.dayCount(r.presetRange("Last 7 days", "2026-01-01")), 7);
    assert.equal(r.dayCount(r.presetRange("This year", "2024-12-31")), 366);
    assert.deepEqual(r.previousRange({ start: "2026-01-01", end: "2026-01-01" }), { start: "2025-12-31", end: "2025-12-31" });
  });
  check("Sunday and Monday group into correct weeks; partial months preserved", () => {
    const result = r.buildReport([], { ...filters, start: "2026-09-27", end: "2026-10-05", interval: "Weekly" });
    assert.deepEqual(result.buckets.map(b => b.key), ["2026-09-21", "2026-09-28", "2026-10-05"]);
    const monthly = r.buildReport([], { ...filters, start: "2026-09-27", interval: "Monthly" });
    assert.equal(monthly.buckets[0].start, "2026-09-27"); assert.equal(monthly.buckets[0].end, "2026-09-30");
  });
  check("Malformed, negative, fractional and duplicate records excluded", () => {
    const result = r.buildReport([order("A"), order("A"), order("NEG", {unitPriceCents:-1}), order("DATE",{date:"2026-02-30"}), order("INF",{unitPriceCents:Infinity}), order("Q",{quantity:1.5}), order("H",{pickupHour:25})],filters);
    assert.equal(result.totals.orders,1); assert.equal(result.excluded,6);
  });
  check("Pickup counts exclude cancellations and include Sunday", () => {
    const result = r.buildReport([order("SUN",{date:"2026-10-04"}),order("CAN",{date:"2026-10-04",status:"cancelled"}),order("UNK",{pickupHour:null})],filters);
    assert.equal(result.heatmap[15][6],1); assert.equal(result.unknownPickupTimes,1);
  });
  check("Repeat customers require stable identity", () => {
    const result = r.buildReport([order("A"),order("B"),order("C",{customerId:"C2"}),order("D",{customerId:null})],filters);
    assert.equal(result.knownCustomers,2); assert.equal(result.repeatCustomers,1); assert.equal(result.repeatRate,50); assert.equal(result.unknownCustomers,1);
  });
  check("CSV escapes quotes, commas, newlines and spreadsheet formulas", () => {
    assert.equal(r.csvCell('a,"b"\nc'), '"a,""b""\nc"');
    for(const text of ["=1+1"," +SUM(A1:A2)","\t@SUM(A1)","-2+3","\rtest"]) assert.ok(r.csvCell(text).startsWith('"\''));
    assert.equal(r.csvCell(-3), '"-3"');
    assert.ok(r.toCsv([["a","b"]]).startsWith("\uFEFF"));
  });
  check("Exports contain selected metadata and every filtered order", () => {
    const csv = r.reportCsv(report,"orders","2026-10-19T00:00:00Z");
    assert.ok(csv.includes('"Asia/Manila"')); assert.ok(csv.includes('"2026-10-01"')); assert.ok(csv.includes('"2026-10-07"'));
    for(const id of ["A","B","C","D"]) assert.ok(csv.includes(`\r\n"${id}",`));
    assert.ok(!csv.includes('\r\n"E",')); assert.ok(!csv.includes('\r\n"S",'));
    const many = r.buildReport(Array.from({length:31},(_,i)=>order("ROW"+i)),filters);
    assert.equal((r.reportCsv(many,"orders","test").match(/\r\n"ROW/g)||[]).length,31);
    assert.ok(r.reportCsv(report,"summary","test").includes('"Collected value (PHP)","465","155"'));
    assert.ok(r.reportCsv(report,"products","test").includes('"Latte","3","2","465"'));
  });
  check("Local adapter keeps old orders undated and handles 12 AM / PM", () => {
    const base = { id:"WALK-1",customer:"Same name",product:"Latte",quantity:1,unitPrice:155,status:"collected",source:"walk-in demo",pickupTime:"12:00 AM" };
    const result = adapter.localReportOrders([base,{...base,id:"WALK-2",createdAt:"2026-10-01T16:00:00Z"},{...base,id:"WALK-3",createdAt:"2026-10-01T00:00:00Z",pickupTime:"12:00 PM"}]);
    assert.equal(result.undated,1); assert.equal(result.records[0].date,"2026-10-02");
    assert.equal(result.records[0].pickupHour,0); assert.equal(result.records[1].pickupHour,12);
    assert.equal(result.records[0].customerId,null);
  });
  check("Storage round trip preserves creation time and notifies reports", () => {
    const data = new Map(); let events = 0;
    globalThis.window = { localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},dispatchEvent:()=>{events++;} };
    const value={id:"WALK-1",customer:"Test",product:"Latte",quantity:1,unitPrice:155,status:"queued",source:"walk-in demo",pickupTime:"3:40 PM",createdAt:"2026-10-01T00:00:00Z"};
    assert.equal(storage.safeWriteJson(storage.BUSINESS_ORDER_STORAGE,[value]),true); assert.equal(events,1);
    assert.equal(storage.readExtraOrders()[0].createdAt,"2026-10-01T00:00:00.000Z");
    storage.safeWriteJson(storage.BUSINESS_ORDER_STORAGE,[{...storage.readExtraOrders()[0],status:"collected"}]);
    assert.equal(adapter.readLocalReportOrders().records[0].status,"collected");
    data.set(storage.BUSINESS_ORDER_STORAGE,"invalid"); assert.deepEqual(storage.readExtraOrders(),[]);
    globalThis.window.localStorage.getItem=()=>{throw new Error("Denied")}; assert.deepEqual(storage.readExtraOrders(),[]);
    delete globalThis.window;
  });
  check("Sample history is deterministic and covers current and previous year selections", () => {
    const a=r.createSampleHistory("2026-10-19"); assert.deepEqual(a,r.createSampleHistory("2026-10-19"));
    assert.equal(new Set(a.map(o=>o.id)).size,a.length);
    for(const period of ["Last 7 days","Last 30 days","Last 90 days","This year"]){ const result=r.buildReport(a,{...r.presetRange(period,"2026-10-19"),source:"sample",status:"all",interval:"Monthly"}); assert.ok(result.totals.orders>0); assert.ok(result.previous.start>=a[0].date); }
  });
  check("Authentication guard and Batch 7 integration files retained", () => {
    const page=readFileSync(resolve(root,"app/business/analytics/page.tsx"),"utf8");
    assert.ok(page.includes("supabase.auth.getUser()")); assert.ok(page.includes('redirect("/auth/business")'));
    for(const file of ["business-dashboard.tsx","business-orders.tsx"]){const s=readFileSync(join(root,"components/business",file),"utf8"); assert.ok(s.includes("createdAt: new Date().toISOString()")); assert.ok(s.includes("/business/analytics"));}
    assert.ok(existsSync(join(root,"components/business/analytics.module.css")));
  });
  console.log(`\n${passed} Batch 7 checks passed. These checks do not replace a full build or authenticated browser test.`);
} finally { rmSync(temporary,{recursive:true,force:true}); }
