"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarClock, CheckCircle2, ChevronDown, ChevronRight, CircleAlert,
  ClipboardList, Coffee, FileText, Filter, LayoutDashboard, Menu,
  Plus, Printer, RefreshCcw, Search, Settings, ShieldCheck,
  ShoppingBag, UsersRound, X, BarChart3,
} from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import {
  BUSINESS_ORDER_STORAGE, BUSINESS_STATUS_STORAGE, demoProducts, money,
  readDemoStatuses, readExtraOrders, safeWriteJson, sampleOrders,
  type BusinessDemoOrder, type DemoOrderStatus,
} from "./demo-business-data";
import shell from "./dashboard.module.css";
import styles from "./orders.module.css";

type FilterStatus = "all" | DemoOrderStatus;
type SortMode = "recent" | "pickup" | "total";

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { name: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { name: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { name: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { name: "Customers", icon: UsersRound, href: "", batch: 5 },
  { name: "Analytics", icon: BarChart3, href: "", batch: 6 },
  { name: "Settings", icon: Settings, href: "", batch: 7 },
] as const;

const statusNames: Record<DemoOrderStatus, string> = {
  queued: "Queued", preparing: "Preparing", ready: "Ready", collected: "Completed", cancelled: "Cancelled",
};
const nextStatus: Record<DemoOrderStatus, DemoOrderStatus | null> = {
  queued: "preparing", preparing: "ready", ready: "collected", collected: null, cancelled: null,
};
const filters: FilterStatus[] = ["all", "queued", "preparing", "ready", "collected", "cancelled"];

const photos: Record<string, string> = {
  "Caramel Macchiato": "/schedu/discovery/product-caramel-macchiato.jpg",
  "Spanish Latte": "/schedu/discovery/product-spanish-latte.jpg",
  Cappuccino: "/schedu/discovery/product-cappuccino.jpg",
  Croissant: "/schedu/discovery/product-croissant.jpg",
  "Glazed Donut": "/schedu/discovery/product-glazed-donut.jpg",
};

function avatar(email: string): string {
  return (email.split("@")[0] || "SB").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB";
}

function parsePickupTime(value: string): number {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Infinity;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
}

function OrderStatus({ value }: { value: DemoOrderStatus }) {
  return <span className={`${styles.status} ${styles[`status_${value}`]}`}>{statusNames[value]}</span>;
}

export function BusinessOrders({ email }: { email: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [extraOrders, setExtraOrders] = useState<BusinessDemoOrder[]>([]);
  const [overrides, setOverrides] = useState<Record<string, DemoOrderStatus>>({});
  const [selected, setSelected] = useState<string | null>("EX-0142");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [product, setProduct] = useState<string>(demoProducts[0].name);
  const [quantity, setQuantity] = useState(1);
  const [pickup, setPickup] = useState("3:40 PM");
  const [dateLabel, setDateLabel] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = () => {
      setExtraOrders(readExtraOrders());
      setOverrides(readDemoStatuses());
    };
    load();
    setDateLabel(new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }));
    setHydrated(true);
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  useEffect(() => {
    if (!createOpen && !mobileMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setCreateOpen(false); setMobileMenu(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [createOpen, mobileMenu]);

  const allOrders = useMemo(() => [
    ...extraOrders,
    ...sampleOrders.map(item => ({ ...item, status: overrides[item.id] ?? item.status })),
  ], [extraOrders, overrides]);
  const selectedOrder = allOrders.find(item => item.id === selected) ?? null;
  const counts = useMemo(() => {
    const result: Record<FilterStatus, number> = { all: allOrders.length, queued: 0, preparing: 0, ready: 0, collected: 0, cancelled: 0 };
    for (const order of allOrders) result[order.status]++;
    return result;
  }, [allOrders]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = allOrders.filter(item =>
      (filter === "all" || item.status === filter) &&
      (!term || `${item.id} ${item.customer} ${item.product} ${item.pickupTime}`.toLowerCase().includes(term))
    );
    if (sort === "pickup") matches.sort((a, b) => parsePickupTime(a.pickupTime) - parsePickupTime(b.pickupTime));
    if (sort === "total") matches.sort((a, b) => b.quantity * b.unitPrice - a.quantity * a.unitPrice);
    return matches;
  }, [allOrders, query, filter, sort]);

  function updateOrder(order: BusinessDemoOrder, status: DemoOrderStatus) {
    if (!hydrated) return;
    const isForward = nextStatus[order.status] === status;
    const mayCancel = status === "cancelled" && ["queued", "preparing"].includes(order.status);
    if (!isForward && !mayCancel) {
      setNotice("That status change is not available in this demonstration.");
      return;
    }
    if (order.source === "example") {
      const updated = { ...overrides, [order.id]: status };
      setOverrides(updated);
      safeWriteJson(BUSINESS_STATUS_STORAGE, updated);
    } else {
      const updated = extraOrders.map(item => item.id === order.id ? { ...item, status } : item);
      setExtraOrders(updated);
      safeWriteJson(BUSINESS_ORDER_STORAGE, updated);
    }
    setNotice(`${order.id} changed to ${statusNames[status]} in this browser only.`);
  }

  function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated) return;
    const customer = name.trim();
    const chosen = demoProducts.find(item => item.name === product);
    if (!customer || customer.length > 60 || !chosen || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      setNotice("Enter a name, product and quantity from 1 to 10.");
      return;
    }
    const order: BusinessDemoOrder = {
      id: `WALK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      customer, product: chosen.name, unitPrice: chosen.price, quantity,
      pickupTime: pickup, status: "queued", source: "walk-in demo",
    };
    const updated = [order, ...extraOrders].slice(0, 100);
    setExtraOrders(updated);
    const saved = safeWriteJson(BUSINESS_ORDER_STORAGE, updated);
    setSelected(order.id);
    setFilter("all"); setQuery(""); setSort("recent"); setCreateOpen(false);
    setName(""); setQuantity(1);
    setNotice(saved ? "Test order saved in this browser and shared with the Dashboard." : "Test order created for this session; browser storage is unavailable.");
  }

  function resetOrders() {
    if (!hydrated) return;
    setOverrides({}); setExtraOrders([]);
    safeWriteJson(BUSINESS_STATUS_STORAGE, {});
    safeWriteJson(BUSINESS_ORDER_STORAGE, []);
    setSelected("EX-0142"); setFilter("all"); setQuery(""); setSort("recent");
    setNotice("Test orders reset to their original examples. Dashboard pickup capacity was not changed.");
  }

  const browseEmpty = hydrated && filtered.length === 0;

  return (
    <div className={`${shell.workspace} ${styles.workspace}`}>
      {mobileMenu && <button type="button" className={shell.mobileScrim} aria-label="Close business menu" onClick={() => setMobileMenu(false)} />}
      <aside className={`${shell.sidebar} ${mobileMenu ? shell.sidebarOpen : ""}`} aria-label="Business owner navigation">
        <div className={shell.sideBrand}>
          <Link href="/business" className={shell.brandLink} onClick={() => setMobileMenu(false)}>
            <span className={shell.trcBadge}>TR<span>C</span></span>
            <span><strong>Schedu<span>Brew</span></strong><small>OWNER WORKSPACE</small></span>
          </Link>
          <button className={shell.closeSide} type="button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={20}/></button>
        </div>
        <nav className={shell.sideNavigation} aria-label="Business modules">
          {nav.map(({ name, icon: Icon, href, batch }) => href ? (
            <Link key={name} href={href} className={`${shell.sideItem} ${batch === 2 ? shell.sideActive : ""}`} aria-current={batch === 2 ? "page" : undefined} onClick={() => setMobileMenu(false)}><Icon size={18}/><span>{name}</span></Link>
          ) : (
            <button key={name} className={shell.sideItem} type="button" onClick={() => { setMobileMenu(false); setNotice(`${name} is planned for Business Batch ${batch}.`); }}><Icon size={18}/><span>{name}</span><small>Later</small></button>
          ))}
        </nav>
        <div className={shell.sideFoot}>
          <div className={shell.sideFootTitle}><ShieldCheck size={17}/> Smart pickup control</div>
          <p>Monitor the example queue and move orders through preparation stages.</p>
          <span>Test workspace · Batch 2</span>
        </div>
      </aside>
      <div className={shell.mainArea}>
        <header className={shell.topbar}>
          <div className={shell.topLeft}>
            <button type="button" className={shell.mobileMenu} aria-label="Open business menu" onClick={() => setMobileMenu(true)}><Menu size={22}/></button>
            <div><strong>Brewed Awakenings</strong><span>Pasig City Main Branch · Example merchant</span></div>
          </div>
          <div className={shell.topRight}>
            <span className={shell.datePill}><CalendarClock size={14}/>{dateLabel || "Today"}</span>
            <span className={shell.demoTopBadge}><span/> Test mode</span>
            <div className={shell.avatar} title={email} aria-label="Signed in user">{avatar(email)}</div>
            <Logout />
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.headline}>
            <div><span className={styles.eyebrow}>ORDER MANAGEMENT</span><h1>Orders</h1><p>Organize incoming orders and move them from queue to pickup.</p></div>
            <div className={styles.headActions}>
              <button type="button" className={styles.secondaryButton} onClick={resetOrders} disabled={!hydrated}><RefreshCcw size={16}/> Reset test orders</button>
              <button type="button" className={styles.primaryButton} onClick={() => setCreateOpen(true)} disabled={!hydrated}><Plus size={17}/> Create test order</button>
            </div>
          </div>
          <div className={styles.testNotice} role="note"><CircleAlert size={17}/><span>Test workspace. Orders and pickup times are examples saved in this browser. No customer is notified, no payment is collected, and no real pickup is reserved.</span></div>
          {notice && <div className={styles.notice} role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={16}/></button></div>}

          <div className={styles.ordersLayout}>
            <section className={styles.listPanel} aria-label="Order list">
              <div className={styles.listTools}>
                <div className={styles.filters} aria-label="Filter by order status">
                  {filters.map(status => <button key={status} type="button" className={`${styles.filterButton} ${filter === status ? styles.filterSelected : ""}`} onClick={() => { setFilter(status); setSelected(null); }} aria-pressed={filter === status}>
                    {status === "all" ? "All" : statusNames[status]} <span>{counts[status]}</span>
                  </button>)}
                </div>
                <div className={styles.searchWrap}><Search size={17}/><input ref={searchRef} type="search" aria-label="Search order number, customer or product" placeholder="Search orders or customer..." value={query} onChange={event => setQuery(event.target.value)}/></div>
              </div>
              <div className={styles.sortRow}>
                <span><Filter size={15}/> {filtered.length} {filtered.length === 1 ? "order" : "orders"}</span>
                <label>Sort <ChevronDown size={14}/><select value={sort} onChange={event => setSort(event.target.value as SortMode)} aria-label="Sort orders">
                  <option value="recent">Recently added</option><option value="pickup">Pickup time</option><option value="total">Highest total</option>
                </select></label>
              </div>
              <div className={styles.tableScroller}>
                <table className={styles.table}>
                  <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>PICKUP</th><th>STATUS</th><th>TOTAL</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead>
                  <tbody>{hydrated && filtered.map(order => <tr key={order.id} className={selected === order.id ? styles.selectedRow : ""}>
                    <td><strong>{order.id}</strong></td><td>{order.customer}</td><td>{order.quantity} × {order.product}</td><td>{order.pickupTime}</td>
                    <td><OrderStatus value={order.status}/></td><td><strong>{money(order.quantity * order.unitPrice)}</strong></td>
                    <td><button type="button" className={styles.viewButton} aria-label={`View order ${order.id}`} onClick={() => setSelected(order.id)}>View <ChevronRight size={13}/></button></td>
                  </tr>)}</tbody>
                </table>
                {!hydrated && <p className={styles.empty}>Loading example orders...</p>}
                {browseEmpty && <div className={styles.empty}><ShoppingBag size={28}/><strong>No orders found</strong><p>Try a different search term or status filter.</p><button className={styles.textButton} onClick={() => { setQuery(""); setFilter("all"); searchRef.current?.focus(); }}>Clear filters</button></div>}
              </div>
              <div className={styles.tableFooter}><span>Showing {filtered.length} of {counts.all} test orders</span><span>Stored locally · Not connected to customer orders</span></div>
            </section>

            <aside className={styles.detailPanel} aria-label="Selected order details">
              {selectedOrder ? <>
                <div className={styles.detailHeading}><div><strong>Order {selectedOrder.id}</strong><span>{selectedOrder.customer}</span></div><OrderStatus value={selectedOrder.status}/></div>
                <div className={styles.productRow}>
                  {photos[selectedOrder.product] ? <Image src={photos[selectedOrder.product]} alt="" width={49} height={49} /> : <span className={styles.productIcon}><Coffee size={24}/></span>}
                  <div><strong>{selectedOrder.product}</strong><span>{selectedOrder.quantity} item{selectedOrder.quantity === 1 ? "" : "s"} · {selectedOrder.source === "example" ? "Example order" : "Walk-in test"}</span></div>
                  <strong>{money(selectedOrder.quantity * selectedOrder.unitPrice)}</strong>
                </div>
                <div className={styles.pickupBox}><span className={styles.boxTitle}>PICKUP</span><strong>{selectedOrder.pickupTime} · Example counter</strong><p>Illustrative pickup time. No reservation has been made.</p></div>
                <div className={styles.summaryList}><div><span>Quantity</span><strong>{selectedOrder.quantity}</strong></div><div><span>Unit price</span><strong>{money(selectedOrder.unitPrice)}</strong></div><div><span>Subtotal</span><strong>{money(selectedOrder.quantity * selectedOrder.unitPrice)}</strong></div><div><span>Payment</span><strong>Not connected</strong></div></div>
                <div className={styles.stageHeading}>Update order status</div>
                <div className={styles.stageGrid}>
                  {(["queued", "preparing", "ready", "collected"] as DemoOrderStatus[]).map(status => <button key={status} type="button" aria-pressed={selectedOrder.status === status} className={selectedOrder.status === status ? styles.stageCurrent : styles.stageButton} disabled={!hydrated || (selectedOrder.status !== status && nextStatus[selectedOrder.status] !== status)} onClick={() => status !== selectedOrder.status && updateOrder(selectedOrder, status)}>{status === "collected" ? "Completed" : statusNames[status]}</button>)}
                </div>
                {selectedOrder.status === "cancelled" && <p className={styles.warningMessage}>This example order was cancelled. Its status cannot be advanced.</p>}
                {selectedOrder.status === "collected" && <p className={styles.successMessage}><CheckCircle2 size={16}/> Order completed in this test workspace.</p>}
                <div className={styles.detailActions}>
                  <Link className={styles.printButton} href={`/business/orders/${encodeURIComponent(selectedOrder.id)}/label`} target="_blank" rel="noopener noreferrer"><Printer size={16}/> Print test pickup label</Link>
                  {(selectedOrder.status === "queued" || selectedOrder.status === "preparing") && <button type="button" className={styles.cancelButton} onClick={() => updateOrder(selectedOrder, "cancelled")}>Cancel test order</button>}
                </div>
              </> : <div className={styles.nothingSelected}><FileText size={34}/><h2>Order details</h2><p>Select an order from the table to review its information and update its test status.</p></div>}
            </aside>
          </div>
          <p className={styles.footer}>ScheduBrew by The Ready Counter · Business frontend prototype · Pickup Schedule arrives in Batch 3</p>
        </main>
      </div>

      {createOpen && <div className={styles.backdrop} onMouseDown={event => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
        <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="create-title">
          <div className={styles.dialogTop}><div><span className={styles.eyebrow}>LOCAL TEST ONLY</span><h2 id="create-title">Create a test order</h2></div><button aria-label="Close create order" type="button" onClick={() => setCreateOpen(false)}><X size={20}/></button></div>
          <p>No real order will be submitted. The entry will appear in both the Orders page and the Business Dashboard.</p>
          <form onSubmit={createOrder} className={styles.form}>
            <label>Customer display name <input autoFocus maxLength={60} minLength={1} required value={name} onChange={event => setName(event.target.value)} placeholder="Example: Maria S."/></label>
            <label>Product <select value={product} onChange={event => setProduct(event.target.value)}>{demoProducts.map(item => <option value={item.name} key={item.name}>{item.name} · {money(item.price)}</option>)}</select></label>
            <div className={styles.formGrid}><label>Quantity <input type="number" min="1" max="10" step="1" value={quantity} required onChange={event => setQuantity(Number(event.target.value))}/></label>
              <label>Example pickup time <select value={pickup} onChange={event => setPickup(event.target.value)}>{["3:20 PM", "3:40 PM", "4:00 PM", "4:20 PM", "4:40 PM"].map(time => <option key={time}>{time}</option>)}</select></label></div>
            <div className={styles.orderPreview}>Sample total <strong>{money(quantity * (demoProducts.find(item => item.name === product)?.price ?? 0))}</strong></div>
            <button type="submit" className={styles.primaryButton}>Add test order</button>
          </form>
        </section>
      </div>}
    </div>
  );
}
