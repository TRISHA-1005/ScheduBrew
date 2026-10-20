"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarClock, ChevronDown, ClipboardList, Coffee, Download, LayoutDashboard, Menu, Printer, RotateCcw, Settings, ShieldCheck, UsersRound, X } from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import { BusinessShopDetails } from "./business-shop-details";
import shell from "./dashboard.module.css";
import styles from "./analytics.module.css";
import { BUSINESS_CHANGED_EVENT, BUSINESS_ORDER_STORAGE } from "./demo-business-data";
import { readLocalReportOrders } from "./analytics-local-data";
import { REPORT_PERIODS, REPORT_STATUSES, REPORT_NOTE, STATUS_LABELS, TREND_VIEWS, WEEKDAYS, buildReport, createSampleHistory, manilaDate, pesoCents, presetRange, reportCsv, validateRange, type AnalyticsReport, type ReportPeriod, type ReportSource, type ReportStatus, type TrendView } from "./analytics-report";

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { name: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { name: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { name: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { name: "Customers", icon: UsersRound, href: "/business/customers", batch: 5 },
  { name: "Analytics and Reports", icon: BarChart3, href: "/business/analytics", batch: 6 },
  { name: "Settings", icon: Settings, href: "/business/settings", batch: 8 },
] as const;
const PAGE_SIZE = 10;
const PICKUP_WINDOWS = [0, 4, 8, 12, 16, 20];
function avatarInitials(email: string) { return (email.split("@")[0] || "SB").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB"; }
function changeLabel(value: number | null) { return value === null ? "No previous value to compare" : `${value > 0 ? "+" : ""}${value.toFixed(1)}% vs previous period`; }
function safeDownloadReport(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  try { anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); }
  finally { anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 2000); }
}
function TrendChart({ report, metric }: { report: AnalyticsReport; metric: "value" | "orders" }) {
  const values = report.buckets.map(b => metric === "value" ? b.valueCents / 100 : b.orders);
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => ({ x: values.length === 1 ? 360 : 65 + index * 595 / (values.length - 1), y: 190 - value / max * 155 }));
  const ticks = new Set([0, Math.floor((values.length - 1) / 3), Math.floor(2 * (values.length - 1) / 3), values.length - 1]);
  return <svg className={styles.chartSvg} viewBox="0 0 700 235" role="img" aria-label={`${metric === "value" ? "Collected order value in PHP" : "Order count"} from ${report.filters.start} through ${report.filters.end}. Exact values are in the trend table.`}>
    {[0, 0.5, 1].map(t => <g key={t}><line x1="65" x2="660" y1={190 - 155 * t} y2={190 - 155 * t} stroke="#dce1e9" strokeDasharray="4 6" /><text x="56" y={194 - 155 * t} textAnchor="end" fontSize="11" fill="#53627b">{new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(max * t)}</text></g>)}
    <text x="65" y="17" fontSize="11" fill="#53627b">{metric === "value" ? "PHP" : "Orders"}</text>
    <polyline points={points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={metric === "value" ? "#d65e2d" : "#24345e"} strokeWidth="3" strokeLinejoin="round" />
    {points.length <= 31 && points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#d65e2d"><title>{report.buckets[i].start}: {metric === "value" ? pesoCents(values[i] * 100) : values[i]}</title></circle>)}
    {[...ticks].filter(i => i >= 0).map(i => <text key={i} x={points[i].x} y="220" textAnchor="middle" fontSize="11" fill="#53627b">{report.buckets[i].start.slice(5)}</text>)}
  </svg>;
}

export function BusinessAnalytics({ email }: { email: string }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>("Last 30 days");
  const [trendView, setTrendView] = useState<TrendView>("Daily");
  const [source, setSource] = useState<ReportSource>("sample");
  const [status, setStatus] = useState<"all" | ReportStatus>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [local, setLocal] = useState<ReturnType<typeof readLocalReportOrders>>({ records: [], undated: 0 });
  const [today, setToday] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState("");
  const [metric, setMetric] = useState<"value" | "orders">("value");
  const [exportKind, setExportKind] = useState<"summary" | "orders" | "products">("summary");
  const [selectedHeatCell, setSelectedHeatCell] = useState<{ day: number; hour: number } | null>(null);
  const [page, setPage] = useState(0);

  function refreshReport(announce = false) {
    const now = new Date();
    setToday(manilaDate(now)); setUpdatedAt(now.toISOString());
    try {
      const raw = window.localStorage.getItem(BUSINESS_ORDER_STORAGE);
      if (raw !== null && !Array.isArray(JSON.parse(raw))) throw new Error("Invalid order storage");
      setLocal(readLocalReportOrders()); setStorageError("");
    } catch { setLocal({ records: [], undated: 0 }); setStorageError("Local order storage is unavailable or unreadable. Local reports cannot be loaded. Sample history remains available."); }
    if (announce) setNotice("Report refreshed from the current data source.");
  }
  useEffect(() => {
    const load = () => refreshReport();
    load();
    window.addEventListener("storage", load); window.addEventListener("focus", load); window.addEventListener(BUSINESS_CHANGED_EVENT, load);
    const timer = window.setInterval(load, 60_000);
    return () => { window.removeEventListener("storage", load); window.removeEventListener("focus", load); window.removeEventListener(BUSINESS_CHANGED_EVENT, load); window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!mobileMenu) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileMenu(false); };
    window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close);
  }, [mobileMenu]);

  const range = useMemo(() => !today ? null : period === "Custom" ? { start: customStart, end: customEnd } : presetRange(period, today), [today, period, customStart, customEnd]);
  const rangeError = range && today ? validateRange(range, today) : null;
  const samples = useMemo(() => today ? createSampleHistory(today) : [], [today]);
  const report = useMemo(() => range && !rangeError && !(source === "local" && storageError) ? buildReport(source === "sample" ? samples : local.records, { ...range, source, status, interval: trendView }) : null, [range, rangeError, source, storageError, samples, local.records, status, trendView]);
  const totalPages = Math.max(1, Math.ceil((report?.orders.length || 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = report?.orders.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE) || [];
  const ownerName = email.split("@")[0] || "Partner";
  const pickupCounts = report ? PICKUP_WINDOWS.map(hour => WEEKDAYS.map((_, day) => report.heatmap.slice(hour, hour + 4).reduce((sum, row) => sum + row[day], 0))) : [];
  const maxPickup = Math.max(1, ...pickupCounts.flat());
  function resetPage() { setPage(0); setSelectedHeatCell(null); setNotice(""); }
  function exportReport() {
    if (!report) return;
    try {
      safeDownloadReport(reportCsv(report, exportKind, new Date().toISOString(), source === "local" ? local.undated : 0), `schedubrew-${exportKind}-${source}-${range!.start}-${range!.end}.csv`);
      setNotice(`${exportKind === "orders" ? "All filtered order rows" : exportKind === "products" ? "Collected product totals" : "Report summary"} exported as CSV.`);
    } catch { setNotice("The download could not start. Please retry or use Print report."); }
  }
  return (
    <div className={`${shell.workspace} ${styles.workspace}`}>
      {mobileMenu && <button type="button" className={`${shell.mobileScrim} ${styles.noPrint}`} aria-label="Close business navigation" onClick={() => setMobileMenu(false)} />}
      <aside className={`${shell.sidebar} ${styles.noPrint} ${mobileMenu ? shell.sidebarOpen : ""}`} aria-label="Business owner navigation">
        <div className={shell.sideBrand}>
          <Link href="/business" className={shell.brandLink} onClick={() => setMobileMenu(false)}>
            <span className={shell.trcBadge}>TR<span>C</span></span>
            <span><strong>Schedu<span>Brew</span></strong><small>OWNER WORKSPACE</small></span>
          </Link>
          <button type="button" className={shell.closeSide} onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className={shell.sideNavigation} aria-label="Business modules">
          {nav.map(({ name, icon: Icon, href, batch }) => href ? (
            <Link key={name} href={href} className={`${shell.sideItem} ${batch === 6 ? shell.sideActive : ""}`} aria-current={batch === 6 ? "page" : undefined} onClick={() => setMobileMenu(false)}>
              <Icon size={18} aria-hidden="true" /><span>{name}</span>
            </Link>
          ) : (
            <button key={name} type="button" className={shell.sideItem} onClick={() => { setMobileMenu(false); setNotice(`${name} is planned for Business Owner Batch ${batch}.`); }}>
              <Icon size={18} aria-hidden="true" /><span>{name}</span><small>Later</small>
            </button>
          ))}
        </nav>
        <div className={shell.sideFoot}>
          <div className={shell.sideFootTitle}><ShieldCheck size={17} /> Smart pickup control</div>
          <p>Balance order volume by time slot and keep the counter moving smoothly.</p>
          <span>Frontend workspace · Batch 7</span>
        </div>
      </aside>

      <div className={shell.mainArea}>
        <header className={`${shell.topbar} ${styles.noPrint}`}>
          <div className={shell.topLeft}>
            <button type="button" className={shell.mobileMenu} onClick={() => setMobileMenu(true)} aria-label="Open business navigation"><Menu size={22} /></button>
            <BusinessShopDetails />
          </div>
          <div className={shell.topRight}>
            <span className={shell.datePill}><CalendarClock size={14} />{today}</span>
            <span className={shell.demoTopBadge}><span /> Test mode</span>
            <div className={shell.avatar} title={email} aria-label={`Signed in user ${ownerName}`}>{avatarInitials(email)}</div>
            <Logout />
          </div>
        </header>

        <main className={styles.content}>
          <div className={styles.headingRow}>
            <div><span className={styles.eyebrow}>PERFORMANCE · BATCH 7</span><h1>Analytics and Reports</h1><p>Explore orders, product performance, and pickup demand.</p></div>
            <div className={`${styles.headerActions} ${styles.noPrint}`}>
              <button type="button" className={styles.secondaryButton} onClick={() => refreshReport(true)}><RotateCcw size={15} /> Refresh</button>
              <button type="button" className={styles.secondaryButton} disabled={!report} onClick={() => window.print()}><Printer size={15} /> Print report</button>
            </div>
          </div>
          <div className={styles.dataBanner}><strong>{source === "sample" ? "Illustrative sample history" : "Local browser demo orders"}</strong><span>Demo workspace. Reports do not contain live sales or verified payments. Local orders are shared by users of this browser.</span></div>
          {notice && <div className={`${styles.notice} ${styles.noPrint}`} role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={16} /></button></div>}
          <section className={`${styles.filters} ${styles.noPrint}`} aria-label="Report filters">
            <label className={styles.periodControl}><span>Data source</span><select value={source} onChange={e => { setSource(e.target.value as ReportSource); resetPage(); }}><option value="sample">Sample history</option><option value="local">Local demo orders</option></select></label>
            <label className={styles.periodControl}><span>Report period</span><span className={styles.selectWrap}><select value={period} aria-label="Choose analytics report period" onChange={e => { const next = e.target.value as ReportPeriod; if (next === "Custom" && range) { setCustomStart(range.start); setCustomEnd(range.end); } setPeriod(next); resetPage(); }}>{REPORT_PERIODS.map(p => <option key={p}>{p}</option>)}</select><ChevronDown size={15} /></span></label>
            <label className={styles.periodControl}><span>Order status</span><select value={status} onChange={e => { setStatus(e.target.value as typeof status); resetPage(); }}><option value="all">All statuses</option>{REPORT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
            {period === "Custom" && <><label className={styles.periodControl}><span>Start date</span><input type="date" min="2000-01-01" value={customStart} max={today} aria-invalid={!!rangeError} aria-describedby={rangeError ? "range-error" : undefined} onChange={e => { setCustomStart(e.target.value); resetPage(); }} /></label><label className={styles.periodControl}><span>End date</span><input type="date" min="2000-01-01" value={customEnd} max={today} aria-invalid={!!rangeError} aria-describedby={rangeError ? "range-error" : undefined} onChange={e => { setCustomEnd(e.target.value); resetPage(); }} /></label></>}
            <div className={styles.exportControls}><label className={styles.periodControl}><span>CSV contents</span><select value={exportKind} onChange={e => setExportKind(e.target.value as typeof exportKind)}><option value="summary">Summary report</option><option value="orders">All filtered orders</option><option value="products">Collected products</option></select></label><button type="button" className={styles.primaryButton} onClick={exportReport} disabled={!report}><Download size={15} /> Export CSV</button></div>
          </section>
          {rangeError && <p className={styles.error} role="alert" id="range-error">{rangeError}</p>}
          {storageError && source === "local" && <p className={styles.error} role="alert">{storageError}</p>}
          {!today && <p role="status">Loading report data...</p>}
          {report && <>
            <p className={styles.rangeSummary}><strong>{report.filters.start} through {report.filters.end}</strong> · Asia/Manila · {status === "all" ? "All statuses" : STATUS_LABELS[status]} · Compared with {report.previous.start} through {report.previous.end}</p>
            {source === "local" && local.undated > 0 && <p className={styles.dataQuality}>{local.undated} older local order{local.undated === 1 ? " has" : "s have"} no creation date and {local.undated === 1 ? "is" : "are"} excluded. New orders created from Dashboard or Orders will include dates.</p>}
            {report.excluded > 0 && <p className={styles.dataQuality}>{report.excluded} invalid or duplicate records excluded.</p>}
            {source === "sample" && report.previous.start < samples[0]?.date && <p className={styles.dataQuality}>Sample history starts on {samples[0]?.date}. Dates before that have no sample records; comparisons may be incomplete.</p>}
            <section className={styles.kpiGrid} aria-label="Performance summary">
              <article className={styles.kpiCard}><span>Collected order value</span><strong>{pesoCents(report.totals.valueCents)}</strong><small>{changeLabel(report.salesChange)}</small></article>
              <article className={styles.kpiCard}><span>Orders in selection</span><strong>{report.totals.orders.toLocaleString("en-PH")}</strong><small>{changeLabel(report.orderChange)}</small></article>
              <article className={styles.kpiCard}><span>Average collected order</span><strong>{pesoCents(report.totals.averageCents)}</strong><small>{report.totals.collected} collected orders</small></article>
              <article className={styles.kpiCard}><span>Cancellation rate</span><strong>{report.totals.cancellationRate.toFixed(1)}%</strong><small>{report.totals.cancelled} of {report.totals.orders} selected orders</small></article>
            </section>
            {report.orders.length === 0 && <div className={styles.empty} role="status"><strong>No orders in this selection</strong><p>Change the dates, status or data source. To test local reports, create an order in <Link href="/business/orders">Orders</Link>. Collected value appears after the order is marked Collected.</p></div>}
            <div className={styles.analyticsGrid}>
              <section className={styles.panel} aria-label="Sales and orders trend">
                <div className={styles.panelHeading}><div><h2>Order trends</h2><p>Every chart uses the selected dates and status.</p></div><div className={`${styles.viewTabs} ${styles.noPrint}`} role="group" aria-label="Chart interval">{TREND_VIEWS.map(view => <button key={view} type="button" className={trendView === view ? styles.viewTabActive : styles.viewTab} aria-pressed={trendView === view} onClick={() => setTrendView(view)}>{view}</button>)}</div></div>
                <div className={`${styles.viewTabs} ${styles.noPrint}`} role="group" aria-label="Chart metric"><button type="button" className={metric === "value" ? styles.viewTabActive : styles.viewTab} aria-pressed={metric === "value"} onClick={() => setMetric("value")}>Collected value</button><button type="button" className={metric === "orders" ? styles.viewTabActive : styles.viewTab} aria-pressed={metric === "orders"} onClick={() => setMetric("orders")}>Order count</button></div>
                <div className={styles.chartWrap}><TrendChart report={report} metric={metric} /></div>
                <p className={styles.panelFootnote}>{trendView} buckets. Weeks start on Monday. First and last buckets may cover partial weeks or months.</p>
                <details className={`${styles.trendDetails} ${styles.noPrint}`}><summary>View exact trend values</summary><div className={styles.tableScroller}><table className={styles.productTable}><caption>All selected trend buckets</caption><thead><tr><th scope="col">From</th><th scope="col">Through</th><th scope="col">Orders</th><th scope="col">Collected value</th></tr></thead><tbody>{report.buckets.map(b => <tr key={b.key}><td>{b.start}</td><td>{b.end}</td><td>{b.orders}</td><td>{pesoCents(b.valueCents)}</td></tr>)}</tbody></table></div></details>
              </section>
              <section className={styles.panel} aria-label="Pickup demand">
                <div className={styles.panelHeading}><div><h2>Pickup demand</h2><p>Noncancelled orders by creation weekday and pickup hour. Each cell covers four hours.</p></div></div>
                <div className={styles.heatmapScroller}><div className={styles.heatmap} role="group" aria-label="Pickup counts by weekday and hour"><span />{WEEKDAYS.map(day => <span key={day} className={styles.heatDay}>{day}</span>)}{PICKUP_WINDOWS.map((hour, row) => <div className={styles.heatRow} key={hour}><span className={styles.heatTime}>{String(hour).padStart(2, "0")}:00</span>{WEEKDAYS.map((day, col) => { const count = pickupCounts[row][col]; const selected = selectedHeatCell?.day === col && selectedHeatCell.hour === hour; return <button key={day} type="button" className={`${styles.heatCell} ${styles[`heat${count === 0 ? 0 : Math.ceil(count / maxPickup * 5)}`]} ${selected ? styles.heatSelected : ""}`} aria-label={`${day} ${hour}:00 to ${hour + 3}:59: ${count} orders`} aria-pressed={selected} onClick={() => setSelectedHeatCell({ day: col, hour })}>{count}</button>; })}</div>)}</div></div>
                <div className={styles.heatmapFooter} aria-live="polite">{selectedHeatCell ? <span>{WEEKDAYS[selectedHeatCell.day]}, {selectedHeatCell.hour}:00 to {selectedHeatCell.hour + 3}:59: {pickupCounts[PICKUP_WINDOWS.indexOf(selectedHeatCell.hour)][selectedHeatCell.day]} orders.</span> : <span>Select a cell for its count. These are pickup time preferences, not measured arrival times.</span>}{report.unknownPickupTimes > 0 && <span>{report.unknownPickupTimes} orders have no valid pickup time.</span>}</div>
              </section>
            </div>
            <div className={styles.bottomGrid}>
              <section className={styles.panel} aria-label="Product performance"><div className={styles.panelHeading}><div><h2>Product performance</h2><p>All products from collected orders, ranked by value.</p></div><span className={styles.countPill}>{report.products.length} products</span></div><div className={styles.tableScroller}><table className={styles.productTable}><caption>Collected products</caption><thead><tr><th scope="col">Product</th><th scope="col">Units</th><th scope="col">Orders</th><th scope="col">Value</th></tr></thead><tbody>{report.products.map(p => <tr key={p.name}><td><strong>{p.name}</strong></td><td>{p.units}</td><td>{p.orders}</td><td>{pesoCents(p.valueCents)}</td></tr>)}{report.products.length === 0 && <tr><td colSpan={4}>No collected products in this selection.</td></tr>}</tbody></table></div></section>
              <section className={styles.panel} aria-label="Order outcomes"><div className={styles.panelHeading}><div><h2>Order outcomes</h2><p>Status counts follow the report filters.</p></div></div><ul className={styles.statusList}>{REPORT_STATUSES.map(s => <li key={s}><span>{STATUS_LABELS[s]}</span><strong>{report.statuses[s]}</strong></li>)}</ul><div className={styles.retentionDivider} /><h2 className={styles.smallHeading}>Repeat customer rate</h2><div className={styles.retentionValue}>{report.repeatRate === null ? "Unavailable" : `${report.repeatRate.toFixed(1)}%`}</div><p className={styles.definition}>{report.knownCustomers ? `${report.repeatCustomers} of ${report.knownCustomers} identified customers placed at least two collected orders within this selection.` : source === "local" ? "Local orders have no stable customer IDs, so repeat customers cannot be measured." : "No identified collected customers in this selection."}</p>{report.unknownCustomers > 0 && <p className={styles.definition}>{report.unknownCustomers} collected orders excluded from the customer calculation because no customer ID is available.</p>}</section>
            </div>
            <section className={`${styles.panel} ${styles.noPrint}`} aria-label="Detailed order report"><div className={styles.panelHeading}><div><h2>Detailed orders</h2><p>{report.orders.length} filtered rows. Order CSV includes every page. Order value below includes all selected statuses.</p></div></div><div className={styles.tableScroller}><table className={styles.productTable}><caption>Orders by creation date, newest first</caption><thead><tr><th scope="col">Order</th><th scope="col">Date</th><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Value</th><th scope="col">Status</th></tr></thead><tbody>{pageRows.map(o => <tr key={o.id}><td>{o.id}</td><td>{o.date}</td><td>{o.product}</td><td>{o.quantity}</td><td>{pesoCents(o.quantity * o.unitPriceCents)}</td><td>{STATUS_LABELS[o.status]}</td></tr>)}{!pageRows.length && <tr><td colSpan={6}>No matching orders.</td></tr>}</tbody></table></div><div className={styles.pagination}><button type="button" className={styles.secondaryButton} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span aria-live="polite">Page {currentPage + 1} of {totalPages}</span><button type="button" className={styles.secondaryButton} disabled={currentPage + 1 >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div></section>
            <section className={styles.definitions} aria-label="Report definitions"><h2>How to read this report</h2><p>{REPORT_NOTE}</p><p>Order counts include all statuses selected above. Cancelled and unfinished orders contribute no collected value. Repeat customer rate measures repeat purchases within this selection, not cohort retention. Pickup demand uses order creation weekday because the owner queue does not store a separate pickup date.</p><p>Previous period comparisons use the same number of calendar days immediately before the selection and the same source and status filters. Zero previous value is shown without a percentage when the current value is positive.</p><p>Printing produces this summary. Use CSV for full order details and exact trend values.</p></section>
            <div className={styles.reportFoot}><span>Refreshed {updatedAt ? new Date(updatedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : ""} · Asia/Manila</span><span>Analytics and Reports · Batch 7</span></div>
          </>}
        </main>
      </div>
    </div>
  );
}
