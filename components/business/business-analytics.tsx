"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3, CalendarClock, Check, TrendingUp,
  ChevronDown, ClipboardList, Coffee, Download, LayoutDashboard, Menu, RotateCcw,
  Settings, ShieldCheck, UsersRound, X,
} from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import shell from "./dashboard.module.css";
import styles from "./analytics.module.css";
import {
  ANALYTICS_PERIODS, BASE_ANALYTICS, PERIOD_FACTORS, PERIOD_TRENDS,
  PICKUP_DAYS, PICKUP_HEATMAP, PICKUP_PERIODS, TOP_PRODUCTS, TREND_DATA,
  TREND_VIEWS, csvCell, peso, readLocalOrderActivity,
  type AnalyticsPeriod, type TrendView,
} from "./analytics-demo-data";

type LocalActivity = { count: number; revenue: number };
type SelectedHeatCell = { day: string; time: string; level: number } | null;

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { name: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { name: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { name: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { name: "Customers", icon: UsersRound, href: "/business/customers", batch: 5 },
  { name: "Analytics", icon: BarChart3, href: "/business/analytics", batch: 6 },
  { name: "Settings", icon: Settings, href: "", batch: 7 },
] as const;

function avatarInitials(email: string): string {
  const part = email.split("@")[0] || "SB";
  return part.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB";
}

function chartPoints(values: number[]) {
  const left = 42;
  const right = 672;
  const top = 24;
  const bottom = 184;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return values.map((value, index) => ({
    x: left + (values.length <= 1 ? 0 : index * ((right - left) / (values.length - 1))),
    y: bottom - ((value - min) / spread) * (bottom - top),
  }));
}

function safeDownloadReport(rows: Array<Array<string | number>>, filename: string) {
  const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function BusinessAnalytics({ email }: { email: string }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [period, setPeriod] = useState<AnalyticsPeriod>("Last 30 days");
  const [trendView, setTrendView] = useState<TrendView>("Daily");
  const [selectedHeatCell, setSelectedHeatCell] = useState<SelectedHeatCell>(null);
  const [activity, setActivity] = useState<LocalActivity>({ count: 0, revenue: 0 });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const refreshActivity = () => setActivity(readLocalOrderActivity());
    refreshActivity();
    window.addEventListener("storage", refreshActivity);
    window.addEventListener("focus", refreshActivity);
    return () => {
      window.removeEventListener("storage", refreshActivity);
      window.removeEventListener("focus", refreshActivity);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenu]);

  const metrics = useMemo(() => {
    const factor = PERIOD_FACTORS[period];
    const trends = PERIOD_TRENDS[period];
    const grossSales = Math.round(BASE_ANALYTICS.grossSales * factor + activity.revenue);
    const orders = Math.max(1, Math.round(BASE_ANALYTICS.orders * factor + activity.count));
    return {
      grossSales,
      orders,
      averageOrderValue: grossSales / orders,
      onTimeRate: trends.onTimeRate,
      salesGrowth: trends.salesGrowth,
      orderGrowth: trends.orderGrowth,
      averageOrderDelta: trends.averageOrderDelta,
    };
  }, [period, activity]);

  const series = TREND_DATA[trendView];
  const revenuePoints = chartPoints(series.revenue);
  const orderPoints = chartPoints(series.orders);
  const revenuePolyline = revenuePoints.map(point => `${point.x},${point.y}`).join(" ");
  const ordersPolyline = orderPoints.map(point => `${point.x},${point.y}`).join(" ");
  const handle = email.split("@")[0]?.split(/[._-]/)[0] || "";
  const ownerName = handle.length > 0 && handle.length <= 14
    ? handle.charAt(0).toUpperCase() + handle.slice(1)
    : "Partner";
  const today = new Intl.DateTimeFormat("en-PH", {
    year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila",
  }).format(new Date());

  function refreshReport() {
    setActivity(readLocalOrderActivity());
    setNotice("Analytics refreshed using the latest browser based test orders.");
  }

  function exportReport() {
    const rows: Array<Array<string | number>> = [
      ["ScheduBrew Analytics Report", "Illustrative frontend data"],
      ["Report period", period],
      ["Generated on", today],
      ["Metric", "Value"],
      ["Gross sales (PHP)", metrics.grossSales],
      ["Orders", metrics.orders],
      ["Average order value (PHP)", metrics.averageOrderValue.toFixed(2)],
      ["On time rate (%)", metrics.onTimeRate],
      ["Sales growth (%)", metrics.salesGrowth],
      ["Order growth (%)", metrics.orderGrowth],
      ["Customer retention (%)", BASE_ANALYTICS.customerRetention],
      [],
      ["Sales and orders trend", trendView],
      ["Period", "Revenue (PHP)", "Orders"],
      ...series.labels.map((label, index) => [label, series.revenue[index], series.orders[index]]),
      [],
      ["Top products", "Units sold", "Revenue (PHP)", "Trend (%)"],
      ...TOP_PRODUCTS.map(product => [product.name, product.units, product.revenue, product.trend]),
      [],
      ["Peak pickup demand heatmap", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM"],
      ...PICKUP_DAYS.map((day, index) => [day, ...PICKUP_HEATMAP.map(row => row[index])]),
      [],
      ["Additional local test orders", activity.count],
      ["Additional local test order value (PHP)", activity.revenue],
      ["Data note", "Illustrative values only. Not connected to PostgreSQL or live payments."],
    ];
    const date = new Date().toISOString().slice(0, 10);
    safeDownloadReport(rows, `schedu-brew-analytics-${date}.csv`);
    setNotice("Analytics CSV report exported. The report contains illustrative figures and local test order adjustments.");
  }

  return (
    <div className={`${shell.workspace} ${styles.workspace}`}>
      {mobileMenu && <button type="button" className={shell.mobileScrim} aria-label="Close business navigation" onClick={() => setMobileMenu(false)} />}
      <aside className={`${shell.sidebar} ${mobileMenu ? shell.sidebarOpen : ""}`} aria-label="Business owner navigation">
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
          <span>Frontend workspace · Batch 6</span>
        </div>
      </aside>

      <div className={shell.mainArea}>
        <header className={shell.topbar}>
          <div className={shell.topLeft}>
            <button type="button" className={shell.mobileMenu} onClick={() => setMobileMenu(true)} aria-label="Open business navigation"><Menu size={22} /></button>
            <div><strong>Brewed Awakenings</strong><span>Pasig City Main Branch · Test shop</span></div>
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
            <div><span className={styles.eyebrow}>PERFORMANCE</span><h1>Analytics</h1><p>Understand demand, pickup behavior, and what drives revenue.</p></div>
            <div className={styles.headerActions}>
              <label className={styles.periodControl}><span>Report period</span><span className={styles.selectWrap}><select value={period} onChange={event => { setPeriod(event.target.value as AnalyticsPeriod); setNotice(""); }} aria-label="Choose analytics report period">{ANALYTICS_PERIODS.map(value => <option key={value} value={value}>{value}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></span></label>
              <button type="button" className={styles.secondaryButton} onClick={refreshReport}><RotateCcw size={15} /> Refresh</button>
              <button type="button" className={styles.primaryButton} onClick={exportReport}><Download size={16} /> Export report</button>
            </div>
          </div>

          {notice && <div className={styles.notice} role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={16} /></button></div>}

          <section className={styles.kpiGrid} aria-label="Performance summary">
            <article className={styles.kpiCard}><span>Gross sales</span><strong>{peso(metrics.grossSales)}</strong><small className={styles.positive}><TrendingUp size={14} /> +{metrics.salesGrowth}%</small></article>
            <article className={styles.kpiCard}><span>Orders</span><strong>{metrics.orders.toLocaleString("en-PH")}</strong><small className={styles.positive}><TrendingUp size={14} /> +{metrics.orderGrowth}%</small></article>
            <article className={styles.kpiCard}><span>Avg. order value</span><strong>{peso(metrics.averageOrderValue, 2)}</strong><small className={styles.positive}><TrendingUp size={14} /> +{peso(metrics.averageOrderDelta, 2)}</small></article>
            <article className={styles.kpiCard}><span>On time rate</span><strong>{metrics.onTimeRate.toFixed(1)}%</strong><small className={styles.goodLabel}><Check size={13} /> Best this quarter</small></article>
          </section>

          <div className={styles.analyticsGrid}>
            <section className={styles.panel} aria-label="Sales and orders trend">
              <div className={styles.panelHeading}>
                <div><h2>Sales and orders</h2><p>{period} · {trendView.toLowerCase()} trend</p></div>
                <div className={styles.viewTabs} role="group" aria-label="Chart interval">
                  {TREND_VIEWS.map(view => <button key={view} type="button" className={trendView === view ? styles.viewTabActive : styles.viewTab} aria-pressed={trendView === view} onClick={() => setTrendView(view)}>{view}</button>)}
                </div>
              </div>
              <div className={styles.chartLegend}><span><i className={styles.legendRevenue} /> Revenue</span><span><i className={styles.legendOrders} /> Order volume</span></div>
              <div className={styles.chartWrap}>
                <svg className={styles.chartSvg} viewBox="0 0 700 235" role="img" aria-label={`${trendView} sales and order volume trend for ${period}`}>
                  {[35, 75, 115, 155, 195].map(y => <line key={y} x1="42" x2="672" y1={y} y2={y} stroke="#e8ebf0" strokeDasharray="4 6" />)}
                  <polyline points={revenuePolyline} fill="none" stroke="#e26832" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={ordersPolyline} fill="none" stroke="#24345e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  {revenuePoints.map((point, index) => <circle key={`rev-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#e26832" stroke="#fff" strokeWidth="1.5" />)}
                  {orderPoints.map((point, index) => <circle key={`ord-${index}`} cx={point.x} cy={point.y} r="3" fill="#24345e" stroke="#fff" strokeWidth="1.5" />)}
                  {series.labels.map((label, index) => <text key={label} x={revenuePoints[index].x} y="220" textAnchor="middle" fontSize="11" fill="#8791a4">{label}</text>)}
                </svg>
              </div>
              <p className={styles.panelFootnote}>Illustrative reporting trend. Final figures will be calculated from completed orders in the database.</p>
            </section>

            <section className={styles.panel} aria-label="Peak pickup heatmap">
              <div className={styles.panelHeading}><div><h2>Peak pickup heatmap</h2><p>Busy pickup windows by day and time</p></div><span className={styles.heatmapKey}>Higher demand <span><i /><i /><i /></span></span></div>
              <div className={styles.heatmapScroller}>
                <div className={styles.heatmap} role="group" aria-label="Select a day and pickup time to inspect demand">
                  <span className={styles.heatCorner} />
                  {PICKUP_DAYS.map(day => <span key={day} className={styles.heatDay}>{day}</span>)}
                  {PICKUP_PERIODS.map((time, rowIndex) => <div className={styles.heatRow} key={time}>
                    <span className={styles.heatTime}>{time}</span>
                    {PICKUP_DAYS.map((day, colIndex) => {
                      const level = PICKUP_HEATMAP[rowIndex][colIndex];
                      const isSelected = selectedHeatCell?.day === day && selectedHeatCell?.time === time;
                      return <button key={`${day}-${time}`} type="button" className={`${styles.heatCell} ${styles[`heat${level}`]} ${isSelected ? styles.heatSelected : ""}`} title={`${day}, ${time}: ${level >= 4 ? "High" : level === 3 ? "Moderate" : "Low"} illustrative demand`} aria-label={`${day} ${time}, ${level >= 4 ? "high" : level === 3 ? "moderate" : "low"} illustrative pickup demand`} aria-pressed={isSelected} onClick={() => setSelectedHeatCell({ day, time, level })} />;
                    })}
                  </div>)}
                </div>
              </div>
              <div className={styles.heatmapFooter}>{selectedHeatCell ? <><strong>{selectedHeatCell.day}, {selectedHeatCell.time}</strong><span>{selectedHeatCell.level >= 4 ? "High" : selectedHeatCell.level === 3 ? "Moderate" : "Low"} pickup demand in the sample heatmap.</span></> : <span>Select a cell to inspect its illustrative demand level.</span>}</div>
            </section>
          </div>

          <div className={styles.bottomGrid}>
            <section className={styles.panel} aria-label="Top products">
              <div className={styles.panelHeading}><div><h2>Top products</h2><p>Products contributing most to sample sales</p></div><span className={styles.countPill}>Top 3</span></div>
              <div className={styles.tableScroller}>
                <table className={styles.productTable}>
                  <thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Trend</th></tr></thead>
                  <tbody>{TOP_PRODUCTS.map(product => <tr key={product.name}>
                    <td><strong>{product.name}</strong></td><td>{product.units.toLocaleString("en-PH")}</td><td>{peso(product.revenue)}</td><td><span className={styles.trendBadge}><TrendingUp size={12} /> {product.trend}%</span></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <p className={styles.panelFootnote}>Top product figures are sample values from the proposal GUI, not live sales totals.</p>
            </section>

            <section className={styles.panel} aria-label="Customer retention">
              <div className={styles.panelHeading}><div><h2>Customer retention</h2><p>Customers who ordered again within 30 days</p></div><UsersRound size={19} className={styles.panelIcon} /></div>
              <div className={styles.retentionValue}>{BASE_ANALYTICS.customerRetention}%</div>
              <div className={styles.retentionTrack} role="progressbar" aria-label="Customer retention" aria-valuemin={0} aria-valuemax={100} aria-valuenow={BASE_ANALYTICS.customerRetention}><span style={{ width: `${BASE_ANALYTICS.customerRetention}%` }} /></div>
              <div className={styles.retentionDivider} />
              <div className={styles.retentionWindow}><span>Best retention window</span><strong>Weekday afternoons, 2:00–5:00 PM</strong></div>
              <div className={styles.retentionCallout}><BarChart3 size={16} /><span>Use repeat purchase trends to plan loyalty offers and pickup capacity.</span></div>
            </section>
          </div>

          <div className={styles.reportFoot}>
            <span><BarChart3 size={14} /> {activity.count} additional test order{activity.count === 1 ? "" : "s"} from the local owner workspace included in the sales summary.</span>
            <span>Frontend workspace · Analytics and Reports · Batch 6</span>
          </div>
        </main>
      </div>
    </div>
  );
}
