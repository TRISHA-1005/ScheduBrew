/** Batch 7 reporting calculations. Pure functions; no storage, auth or network access. */
export type ReportStatus = "queued" | "preparing" | "ready" | "collected" | "cancelled";
export type ReportSource = "sample" | "local";
export type ReportPeriod = "Last 7 days" | "Last 30 days" | "Last 90 days" | "This year" | "Custom";
export type TrendView = "Daily" | "Weekly" | "Monthly";
export type DateRange = { start: string; end: string };
export type ReportOrder = {
  id: string; date: string; product: string; quantity: number; unitPriceCents: number;
  status: ReportStatus; source: ReportSource; pickupHour: number | null; customerId: string | null;
};
export type ReportFilters = DateRange & { source: ReportSource; status: "all" | ReportStatus; interval: TrendView };
export const REPORT_PERIODS: ReportPeriod[] = ["Last 7 days", "Last 30 days", "Last 90 days", "This year", "Custom"];
export const TREND_VIEWS: TrendView[] = ["Daily", "Weekly", "Monthly"];
export const REPORT_STATUSES: ReportStatus[] = ["queued", "preparing", "ready", "collected", "cancelled"];
export const STATUS_LABELS: Record<ReportStatus, string> = { queued: "Queued", preparing: "Preparing", ready: "Ready", collected: "Collected", cancelled: "Cancelled" };
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const REPORT_NOTE = "Collected order value is quantity × recorded unit price for collected orders, grouped by order creation date in Asia/Manila. It is not verified payment revenue and excludes fees, discounts, refunds and tax adjustments. Browser history retains at most 100 local orders; older undated orders are excluded.";
const DAY = 86_400_000;

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
}
export function manilaDate(value: Date | string = new Date()): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Date(date.getTime() + 8 * 3600_000).toISOString().slice(0, 10) : "";
}
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + days * DAY).toISOString().slice(0, 10);
}
export function dayCount(range: DateRange): number {
  return Math.round((Date.parse(range.end + "T00:00:00Z") - Date.parse(range.start + "T00:00:00Z")) / DAY) + 1;
}
export function validateRange(range: DateRange, today: string): string | null {
  if (!isDateKey(range.start) || !isDateKey(range.end)) return "Choose a valid start and end date.";
  if (range.start < "2000-01-01") return "Choose a start date on or after January 1, 2000.";
  if (range.start > range.end) return "Start date must be on or before the end date.";
  if (range.end > today) return "End date cannot be later than today in Manila.";
  if (dayCount(range) > 366) return "Choose a range of 366 days or fewer.";
  return null;
}
export function presetRange(period: ReportPeriod, today: string): DateRange {
  return { start: period === "This year" ? today.slice(0, 4) + "-01-01" : addDays(today, period === "Last 7 days" ? -6 : period === "Last 90 days" ? -89 : -29), end: today };
}
export function previousRange(range: DateRange): DateRange {
  return { start: addDays(range.start, -dayCount(range)), end: addDays(range.start, -1) };
}
export function percentageChange(current: number, previous: number): number | null {
  return previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;
}
export function pesoCents(value: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
}
export function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && (/^[\s\u0000-\u001f]*[=+@\-]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function toCsv(rows: Array<Array<string | number>>): string {
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}
export function normalizeOrders(input: readonly ReportOrder[]): { orders: ReportOrder[]; excluded: number } {
  const seen = new Set<string>();
  let excluded = 0;
  const orders = input.filter(o => {
    const valid = o && typeof o.id === "string" && o.id.length > 0 && !seen.has(o.id) &&
      typeof o.date === "string" && isDateKey(o.date) && typeof o.product === "string" && o.product.trim().length > 0 &&
      Number.isInteger(o.quantity) && o.quantity > 0 && o.quantity <= 1000 &&
      Number.isSafeInteger(o.unitPriceCents) && o.unitPriceCents >= 0 && o.unitPriceCents <= 100_000_000 &&
      REPORT_STATUSES.includes(o.status) && (o.source === "sample" || o.source === "local") &&
      (o.pickupHour === null || (Number.isInteger(o.pickupHour) && o.pickupHour >= 0 && o.pickupHour <= 23)) &&
      (o.customerId === null || typeof o.customerId === "string");
    if (!valid) { excluded++; return false; }
    seen.add(o.id); return true;
  });
  return { orders, excluded };
}
function totals(orders: ReportOrder[]) {
  const collected = orders.filter(o => o.status === "collected");
  const valueCents = collected.reduce((sum, o) => sum + o.quantity * o.unitPriceCents, 0);
  const cancelled = orders.filter(o => o.status === "cancelled").length;
  return { orders: orders.length, collected: collected.length, valueCents, averageCents: collected.length ? Math.round(valueCents / collected.length) : 0, cancelled, cancellationRate: orders.length ? cancelled / orders.length * 100 : 0 };
}
function bucketKey(date: string, interval: TrendView): string {
  if (interval === "Monthly") return date.slice(0, 7) + "-01";
  if (interval === "Weekly") return addDays(date, -(new Date(date + "T00:00:00Z").getUTCDay() + 6) % 7);
  return date;
}
export function buildReport(input: readonly ReportOrder[], filters: ReportFilters) {
  const error = validateRange(filters, "9999-12-31");
  if (error) throw new Error(error);
  const cleaned = normalizeOrders(input);
  const eligible = cleaned.orders.filter(o => o.source === filters.source && (filters.status === "all" || o.status === filters.status));
  const previous = previousRange(filters);
  const orders = eligible.filter(o => o.date >= filters.start && o.date <= filters.end).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const currentTotals = totals(orders);
  const previousTotals = totals(eligible.filter(o => o.date >= previous.start && o.date <= previous.end));
  const buckets = new Map<string, { key: string; start: string; end: string; orders: number; collected: number; valueCents: number }>();
  for (let offset = 0; offset < dayCount(filters); offset++) {
    const date = addDays(filters.start, offset);
    const key = bucketKey(date, filters.interval);
    const bucket = buckets.get(key);
    if (bucket) bucket.end = date;
    else buckets.set(key, { key, start: date, end: date, orders: 0, collected: 0, valueCents: 0 });
  }
  const products = new Map<string, { name: string; units: number; orders: number; valueCents: number }>();
  const statuses = Object.fromEntries(REPORT_STATUSES.map(status => [status, 0])) as Record<ReportStatus, number>;
  const heatmap = Array.from({ length: 24 }, () => Array<number>(7).fill(0));
  const customers = new Map<string, number>();
  let unknownCustomers = 0;
  let unknownPickupTimes = 0;
  for (const order of orders) {
    const bucket = buckets.get(bucketKey(order.date, filters.interval))!;
    bucket.orders++; statuses[order.status]++;
    if (order.status !== "cancelled") {
      if (order.pickupHour === null) unknownPickupTimes++;
      else heatmap[order.pickupHour][(new Date(order.date + "T00:00:00Z").getUTCDay() + 6) % 7]++;
    }
    if (order.status !== "collected") continue;
    const value = order.quantity * order.unitPriceCents;
    bucket.collected++; bucket.valueCents += value;
    const product = products.get(order.product) || { name: order.product, units: 0, orders: 0, valueCents: 0 };
    product.units += order.quantity; product.orders++; product.valueCents += value;
    products.set(order.product, product);
    if (order.customerId) customers.set(order.customerId, (customers.get(order.customerId) || 0) + 1);
    else unknownCustomers++;
  }
  const repeatCustomers = [...customers.values()].filter(count => count > 1).length;
  return {
    filters, previous, orders, totals: currentTotals, previousTotals, excluded: cleaned.excluded,
    salesChange: percentageChange(currentTotals.valueCents, previousTotals.valueCents),
    orderChange: percentageChange(currentTotals.orders, previousTotals.orders),
    buckets: [...buckets.values()], products: [...products.values()].sort((a, b) => b.valueCents - a.valueCents || a.name.localeCompare(b.name)),
    statuses, heatmap, unknownPickupTimes, knownCustomers: customers.size, unknownCustomers, repeatCustomers,
    repeatRate: customers.size ? repeatCustomers / customers.size * 100 : null,
  };
}
export type AnalyticsReport = ReturnType<typeof buildReport>;
export function reportCsv(report: AnalyticsReport, kind: "summary" | "orders" | "products", generatedAt: string, undatedOrders = 0): string {
  const f = report.filters;
  const rows: Array<Array<string | number>> = [
    ["ScheduBrew", "Analytics and Reports"], ["Data source", f.source === "sample" ? "Overview history" : "Local orders"],
    ["From", f.start], ["Through", f.end], ["Time zone", "Asia/Manila"], ["Status filter", f.status], ["Interval", f.interval],
    ["Generated at (UTC)", generatedAt], ["Undated local orders excluded", undatedOrders], ["Invalid or duplicate records excluded", report.excluded], ["Definition", REPORT_NOTE], [],
  ];
  if (kind === "orders") rows.push(["Order ID", "Created date (Manila)", "Product", "Quantity", "Unit price (PHP)", "Order value (PHP)", "Status", "Pickup hour", "Source"],
    ...report.orders.map(o => [o.id, o.date, o.product, o.quantity, o.unitPriceCents / 100, o.quantity * o.unitPriceCents / 100, STATUS_LABELS[o.status], o.pickupHour ?? "Unavailable", o.source]));
  if (kind === "products") rows.push(["Product", "Collected units", "Collected orders", "Collected value (PHP)"], ...report.products.map(p => [p.name, p.units, p.orders, p.valueCents / 100]));
  if (kind === "summary") {
    rows.push(["Metric", "Selected period", "Previous equal period"], ["Comparison from", report.previous.start], ["Comparison through", report.previous.end]);
    for (const [label, key, divisor] of [["Orders", "orders", 1], ["Collected orders", "collected", 1], ["Collected value (PHP)", "valueCents", 100], ["Average collected order (PHP)", "averageCents", 100], ["Cancelled orders", "cancelled", 1], ["Cancellation rate (%)", "cancellationRate", 1]] as const) rows.push([label, report.totals[key] / divisor, report.previousTotals[key] / divisor]);
    rows.push([], ["Period start", "Period end", "Orders", "Collected orders", "Collected value (PHP)"], ...report.buckets.map(b => [b.start, b.end, b.orders, b.collected, b.valueCents / 100]), [],
      ["Product", "Collected units", "Collected orders", "Collected value (PHP)"], ...report.products.map(p => [p.name, p.units, p.orders, p.valueCents / 100]), [],
      ["Status", "Order count"], ...REPORT_STATUSES.map(s => [STATUS_LABELS[s], report.statuses[s]]), [],
      ["Pickup hour", ...WEEKDAYS], ...report.heatmap.map((row, hour) => [hour, ...row]), ["Unknown pickup time", report.unknownPickupTimes], [],
      ["Identified collected customers", report.knownCustomers], ["Repeat customers in selected period", report.repeatCustomers], ["Repeat customer rate (%)", report.repeatRate ?? "Unavailable"], ["Collected orders without customer ID", report.unknownCustomers]);
  }
  return toCsv(rows);
}

/** Deterministic fixtures generated from calendar dates, separate from all local orders. */
export function createSampleHistory(today: string): ReportOrder[] {
  const products = [{ name: "Caramel Macchiato", cents: 16000 }, { name: "Spanish Latte", cents: 15500 }, { name: "Cappuccino", cents: 14500 }, { name: "Croissant", cents: 8000 }, { name: "Glazed Donut", cents: 6500 }];
  const orders: ReportOrder[] = [];
  for (let offset = 731; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    const seed = Math.floor(Date.parse(date + "T00:00:00Z") / DAY);
    for (let i = 0; i < 3 + seed % 5; i++) {
      const product = products[(seed + i) % products.length];
      orders.push({ id: `SAMPLE-${date}-${i + 1}`, date, product: product.name, quantity: 1 + (seed + i) % 3, unitPriceCents: product.cents,
        status: (seed + i) % 11 === 0 ? "cancelled" : offset === 0 && i < 3 ? REPORT_STATUSES[i] : "collected", source: "sample", pickupHour: 8 + (seed + i * 3) % 12, customerId: `SAMPLE-C${(seed + i * 7) % 40}` });
    }
  }
  return orders;
}
