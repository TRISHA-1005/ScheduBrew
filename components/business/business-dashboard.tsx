"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ClipboardList, CalendarClock, Coffee, UsersRound,
  BarChart3, Settings, Bell, Menu, X, Plus, ChevronRight,
  TrendingUp, ShieldCheck, CheckCircle2,
  ArrowRight, SlidersHorizontal, RotateCcw, Info,
} from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import { BusinessShopDetails } from "./business-shop-details";
import {
  BUSINESS_CAPACITY_STORAGE, BUSINESS_ORDER_STORAGE, BUSINESS_STATUS_STORAGE,
  demoProducts, money, popularItems,
  readDemoSlots, readDemoStatuses, readExtraOrders, safeWriteJson,
  sampleOrders, sampleRevenue, sampleSlots,
  type BusinessDemoOrder, type DemoOrderStatus, type DemoPickupSlot,
} from "./demo-business-data";
import s from "./dashboard.module.css";

const sections = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { label: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { label: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { label: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { label: "Customers", icon: UsersRound, href: "/business/customers", batch: 5 },
  { label: "Analytics", icon: BarChart3, href: "/business/analytics", batch: 6 },
  { label: "Settings", icon: Settings, href: "/business/settings", batch: 8 },
] as const;

const stages: Array<{ key: DemoOrderStatus; label: string; className: string }> = [
  { key: "queued", label: "Queued", className: s.queueQueued },
  { key: "preparing", label: "Preparing", className: s.queuePreparing },
  { key: "ready", label: "Ready", className: s.queueReady },
];

const followingStage: Record<DemoOrderStatus, DemoOrderStatus | null> = {
  queued: "preparing", preparing: "ready", ready: "collected", collected: null, cancelled: null,
};

const statusLabels: Record<DemoOrderStatus, string> = {
  queued: "Queued", preparing: "Preparing", ready: "Ready for pickup", collected: "Picked up", cancelled: "Cancelled",
};

function initials(email: string): string {
  const part = email.split("@")[0] || "SB";
  return part.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB";
}

function timeGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function RevenueChart() {
  const min = 6200;
  const max = 9400;
  const coords = sampleRevenue.map((v, i) => {
    const x = 32 + i * 70;
    const y = 148 - ((v - min) / (max - min)) * 119;
    return [x, y] as const;
  });
  const points = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `32,160 ${points} 592,160`;
  return (
    <div className={s.chartWrap}>
      <svg className={s.chartSvg} viewBox="0 0 620 185" role="img" aria-label="Revenue trend across nine periods">
        {[34, 74, 114, 154].map((y) => <line key={y} x1="32" x2="592" y1={y} y2={y} stroke="#e8ebf0" strokeDasharray="4 6" />)}
        <polygon points={area} fill="rgba(216, 96, 42, 0.07)" />
        <polyline points={points} fill="none" stroke="#df652c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#df652c" stroke="white" strokeWidth="2" />)}
        <text x="32" y="178" fontSize="12" fill="#8791a4">Mon</text>
        <text x="308" y="178" fontSize="12" fill="#8791a4">Thu</text>
        <text x="558" y="178" fontSize="12" fill="#8791a4">Sun</text>
      </svg>
    </div>
  );
}

function DemoOrderCard({ order, onOpen }: { order: BusinessDemoOrder; onOpen: () => void }) {
  return (
    <button className={s.orderEntry} type="button" onClick={onOpen} aria-label={`View order ${order.id} for ${order.customer}`}>
      <span className={s.orderEntryTop}><strong>{order.id} · {order.customer}</strong><ChevronRight size={16} aria-hidden="true" /></span>
      <span className={s.orderEntrySub}>{order.quantity} × {order.product}</span>
      <span className={s.orderEntryMeta}>Pickup {order.pickupTime} · {money(order.quantity * order.unitPrice)}</span>
    </button>
  );
}

export function BusinessDashboard({ email }: { email: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [dayLabel, setDayLabel] = useState("Today");
  const [extraOrders, setExtraOrders] = useState<BusinessDemoOrder[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, DemoOrderStatus>>({});
  const [slots, setSlots] = useState<DemoPickupSlot[]>(sampleSlots);
  const [activeFilter, setActiveFilter] = useState<"all" | DemoOrderStatus>("all");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showCapacity, setShowCapacity] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [chosenProduct, setChosenProduct] = useState<string>(demoProducts[0].name);
  const [chosenQuantity, setChosenQuantity] = useState(1);
  const [chosenTime, setChosenTime] = useState("3:40 PM");
  const [selectedSlotId, setSelectedSlotId] = useState(sampleSlots[0].id);
  const [newCapacity, setNewCapacity] = useState(sampleSlots[0].capacity);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const now = new Date();
    setGreeting(timeGreeting(now.getHours()));
    setDayLabel(now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }));
    setExtraOrders(readExtraOrders());
    setStatusOverrides(readDemoStatuses());
    setSlots(readDemoSlots());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!showWalkIn && !showCapacity && !selectedId && !menuOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowWalkIn(false); setShowCapacity(false); setSelectedId(null); setMenuOpen(false); }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [showWalkIn, showCapacity, selectedId, menuOpen]);

  const orders = useMemo(() => [
    ...sampleOrders.map(order => ({ ...order, status: statusOverrides[order.id] ?? order.status })),
    ...extraOrders,
  ], [statusOverrides, extraOrders]);
  const selectedOrder = selectedId ? orders.find(o => o.id === selectedId) : undefined;
  const handle = email.split("@")[0]?.split(/[._-]/)[0] || "";
  const ownerName = handle.length > 0 && handle.length <= 14
    ? handle.charAt(0).toUpperCase() + handle.slice(1)
    : "Partner";
  const activeCount = orders.filter(o => o.status !== "collected" && o.status !== "cancelled").length;
  const pendingCount = orders.filter(o => o.status === "queued").length;
  const maxLoad = Math.max(0, ...slots.map(slot => Math.round((slot.booked / slot.capacity) * 100)));

  function addWalkIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hydrated) return;
    const name = customerName.trim();
    if (!name || name.length > 60 || chosenQuantity < 1 || chosenQuantity > 10) return;
    const product = demoProducts.find(item => item.name === chosenProduct);
    if (!product) return;
    const order: BusinessDemoOrder = {
      createdAt: new Date().toISOString(),
      id: `WALK-${Date.now().toString(36).toUpperCase()}`,
      customer: name, product: product.name, unitPrice: product.price,
      quantity: chosenQuantity, pickupTime: chosenTime,
      status: "queued", source: "walk-in",
    };
    const next = [order, ...extraOrders].slice(0, 100);
    setExtraOrders(next);
    const saved = safeWriteJson(BUSINESS_ORDER_STORAGE, next);
    setNotice(saved ? "Walk-in added successfully." : "Walk-in added for this session.");
    setActiveFilter("all");
    setShowWalkIn(false);
    setCustomerName("");
    setChosenQuantity(1);
  }

  function advanceOrder(order: BusinessDemoOrder) {
    const nextStage = followingStage[order.status];
    if (!nextStage || !hydrated) return;
    if (order.source === "example") {
      const next = { ...statusOverrides, [order.id]: nextStage };
      setStatusOverrides(next);
      safeWriteJson(BUSINESS_STATUS_STORAGE, next);
    } else {
      const next = extraOrders.map(o => o.id === order.id ? { ...o, status: nextStage } : o);
      setExtraOrders(next);
      safeWriteJson(BUSINESS_ORDER_STORAGE, next);
    }
    setNotice(`Updated ${order.id} to “${statusLabels[nextStage]}”.`);
    setSelectedId(null);
  }

  function saveCapacity(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hydrated) return;
    const slot = slots.find(item => item.id === selectedSlotId);
    if (!slot || !Number.isInteger(newCapacity) || newCapacity < slot.booked || newCapacity > 100) {
      setNotice("Capacity must be a whole number between booked orders and 100.");
      return;
    }
    const updated = slots.map(item => item.id === selectedSlotId ? { ...item, capacity: newCapacity } : item);
    setSlots(updated);
    const saved = safeWriteJson(BUSINESS_CAPACITY_STORAGE, updated);
    setNotice(saved ? `Capacity updated for ${slot.label}.` : "Capacity updated for this session.");
    setShowCapacity(false);
  }

  function resetExamples() {
    if (!hydrated) return;
    setExtraOrders([]); setStatusOverrides({}); setSlots(sampleSlots); setActiveFilter("all");
    safeWriteJson(BUSINESS_ORDER_STORAGE, []);
    safeWriteJson(BUSINESS_STATUS_STORAGE, {});
    safeWriteJson(BUSINESS_CAPACITY_STORAGE, sampleSlots);
    setNotice("Dashboard queue and pickup capacities have been reset.");
  }

  function openCapacity() {
    const first = slots[0];
    setSelectedSlotId(first.id);
    setNewCapacity(first.capacity);
    setShowCapacity(true);
  }

  return (
    <div className={s.workspace}>
      {menuOpen && <button type="button" className={s.mobileScrim} aria-label="Close sidebar" onClick={() => setMenuOpen(false)} />}
      <aside className={`${s.sidebar} ${menuOpen ? s.sidebarOpen : ""}`} aria-label="Business owner navigation">
        <div className={s.sideBrand}>
          <Link href="/business" aria-label="Business dashboard" className={s.brandLink} onClick={() => setMenuOpen(false)}>
            <span className={s.trcBadge}>TR<span>C</span></span>
            <span><strong>Schedu<span>Brew</span></strong><small>OWNER WORKSPACE</small></span>
          </Link>
          <button className={s.closeSide} type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className={s.sideNavigation} aria-label="Modules">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} className={`${s.sideItem} ${item.batch === 1 ? s.sideActive : ""}`} href={item.href} aria-current={item.batch === 1 ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={s.sideFoot}>
          <div className={s.sideFootTitle}><ShieldCheck size={17} /> Smart pickup control</div>
          <p>Review incoming orders and balance pickup periods.</p>
        </div>
      </aside>

      <div className={s.mainArea}>
        <header className={s.topbar}>
          <div className={s.topLeft}>
            <button type="button" aria-label="Open business menu" className={s.mobileMenu} onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
            <BusinessShopDetails />
          </div>
          <div className={s.topRight}>
            <span className={s.datePill}><CalendarClock size={14} aria-hidden="true" />{dayLabel}</span>
            <button type="button" className={s.bellButton} aria-label="Notifications" title="Notifications" onClick={() => setNotice("You are all caught up.")}><Bell size={18} /></button>
            <div className={s.avatar} title={email} aria-label="Signed in user">{initials(email)}</div>
            <Logout />
          </div>
        </header>

        <main className={s.content}>
          
          <div className={s.introRow}>
            <div><span className={s.eyebrow}>LIVE OPERATIONS</span><h1>{greeting}, {ownerName}</h1><p>Monitor orders and pickup capacity for today.</p></div>
            <div className={s.introActions}><button className={s.mutedAction} onClick={resetExamples} type="button" title="Reset dashboard data"><RotateCcw size={16} /> Reset dashboard</button><button className={s.orangeButton} type="button" onClick={() => setShowWalkIn(true)}><Plus size={17} /> New walk-in</button></div>
          </div>

          {notice && <div className={s.inlineNotice} role="status"><Info size={17}/><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16}/></button></div>}

          <section className={s.statGrid} aria-label="Shop performance">
            <div className={s.statCard}><span>Orders today</span><strong>{128 + extraOrders.length}</strong><small className={s.positive}><TrendingUp size={13}/> +14% vs yesterday</small></div>
            <div className={s.statCard}><span>Pending orders</span><strong>{18 + pendingCount - sampleOrders.filter(o => o.status === "queued").length}</strong><small className={s.orangeText}>Current queue</small></div>
            <div className={s.statCard}><span>Revenue today</span><strong>{money(12450)}</strong><small className={s.positive}><TrendingUp size={13}/> +9.2%</small></div>
            <div className={s.statCard}><span>On time pickups</span><strong>96%</strong><small className={s.positive}>Pickup performance</small></div>
          </section>

          <div className={s.operationalGrid}>
            <section className={`${s.panel} ${s.queuePanel}`} aria-labelledby="queue-heading" id="business-order-queue">
              <div className={s.panelHead}>
                <div><h2 id="queue-heading">Live order queue</h2><p>Click an order to view details or advance its stage. Open Orders for full management.</p></div>
                <span className={s.countPill}>{activeCount} active</span>
              </div>
              <div className={s.queueFilters} aria-label="Filter order queue">
                {(["all", "queued", "preparing", "ready"] as const).map(filter => (
                  <button type="button" key={filter} aria-pressed={activeFilter === filter} className={activeFilter === filter ? s.filterActive : s.filterButton} onClick={() => setActiveFilter(filter)}>{filter === "all" ? "All active" : statusLabels[filter]}</button>
                ))}
              </div>
              <div className={s.queueGrid}>
                {stages.filter(stage => activeFilter === "all" || stage.key === activeFilter).map(stage => {
                  const laneOrders = orders.filter(o => o.status === stage.key);
                  return <div className={`${s.queueLane} ${stage.className}`} key={stage.key}>
                    <div className={s.laneHeading}><span>{stage.label}</span><strong>{laneOrders.length}</strong></div>
                    {laneOrders.length ? laneOrders.map(order => <DemoOrderCard key={order.id} order={order} onOpen={() => setSelectedId(order.id)} />) : <p className={s.emptyLane}>No orders in this stage.</p>}
                    {stage.key === "ready" && <button type="button" className={s.readyButton} onClick={() => setActiveFilter(activeFilter === "ready" ? "all" : "ready")}>{activeFilter === "ready" ? "Show all orders" : "Open ready queue"}<ArrowRight size={15}/></button>}
                  </div>;
                })}
              </div>
              
            </section>

            <section className={`${s.panel} ${s.pickupPanel}`} aria-labelledby="slot-heading">
              <div className={s.panelHead}><div><h2 id="slot-heading">Pickup slot load</h2><p>Booking capacity</p></div><span className={`${s.healthBadge} ${maxLoad >= 95 ? s.healthWarning : ""}`}>{maxLoad >= 95 ? "Busy" : "Healthy"}</span></div>
              <div className={s.slotList}>{slots.map(slot => {
                const pct = Math.min(100, Math.round(100 * slot.booked / slot.capacity));
                return <div className={s.slotRow} key={slot.id}><span>{slot.label}</span><div className={s.slotTrack} role="progressbar" aria-label={`${slot.label} load`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className={s.slotFill} style={{ width: `${pct}%` }} /></div><span>{pct}%</span></div>;
              })}</div>
              <div className={s.slotSuggestion}><strong>Suggested action</strong><p>{maxLoad >= 90 ? "Review crowded slots and redistribute pickups." : "Pickup slots are within their displayed capacity."}</p></div>
              <button className={s.softOrangeButton} type="button" onClick={openCapacity}><SlidersHorizontal size={16}/> Adjust capacity</button>
            </section>
          </div>

          <div className={s.bottomGrid}>
            <section className={`${s.panel} ${s.revenuePanel}`} aria-labelledby="revenue-heading">
              <div className={s.panelHead}><div><h2 id="revenue-heading">Revenue this week</h2><p>Collected order value over the week</p></div><span className={s.revenuePill}>₱76.4k</span></div>
              <RevenueChart />
            </section>
            <section className={`${s.panel} ${s.popularPanel}`} aria-labelledby="popular-heading"><div className={s.panelHead}><div><h2 id="popular-heading">Top items today</h2><p>Quantities sold today</p></div></div><div className={s.popularList}>{popularItems.map((item, index) => <div key={item.name}><span><b>{index + 1}.</b> {item.name}</span><strong>{item.count}</strong></div>)}</div></section>
          </div>
          <div className={s.footerLine}><span>© ScheduBrew by The Ready Counter</span></div>
        </main>
      </div>

      {showWalkIn && <div className={s.modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowWalkIn(false); }}><section role="dialog" aria-modal="true" aria-labelledby="walkin-title" className={s.modal}>
        <div className={s.modalHead}><div><span className={s.eyebrow}>ORDER ENTRY</span><h2 id="walkin-title">New walk-in order</h2></div><button type="button" aria-label="Close dialog" onClick={() => setShowWalkIn(false)}><X size={19}/></button></div>
        
        <form onSubmit={addWalkIn} className={s.modalForm}><label>Customer display name<input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" minLength={1} maxLength={60} required autoFocus /></label>
          <label>Product<select value={chosenProduct} onChange={(e) => setChosenProduct(e.target.value)}>{demoProducts.map(product => <option key={product.name} value={product.name}>{product.name} · {money(product.price)}</option>)}</select></label>
          <div className={s.twoFields}><label>Quantity<input type="number" min={1} max={10} step={1} value={chosenQuantity} onChange={(e) => setChosenQuantity(Number(e.target.value))} required/></label><label>Pickup time<select value={chosenTime} onChange={(e) => setChosenTime(e.target.value)}>{["3:20 PM", "3:40 PM", "4:00 PM", "4:20 PM", "4:40 PM"].map(time => <option key={time}>{time}</option>)}</select></label></div>
          <button type="submit" className={s.orangeButton}>Add to queue</button></form>
      </section></div>}

      {showCapacity && <div className={s.modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCapacity(false); }}><section role="dialog" aria-modal="true" aria-labelledby="capacity-title" className={s.modal}>
        <div className={s.modalHead}><div><span className={s.eyebrow}>PICKUP CAPACITY</span><h2 id="capacity-title">Adjust capacity</h2></div><button type="button" aria-label="Close dialog" onClick={() => setShowCapacity(false)}><X size={19}/></button></div>
        
        <form onSubmit={saveCapacity} className={s.modalForm}>
          <label>Pickup slot<select value={selectedSlotId} onChange={(e) => { const slot = slots.find(item => item.id === e.target.value); if (slot) { setSelectedSlotId(slot.id); setNewCapacity(slot.capacity); } }}>{slots.map(slot => <option value={slot.id} key={slot.id}>{slot.label} · {slot.booked} booked</option>)}</select></label>
          <label>Maximum orders for this slot<input type="number" min={slots.find(slot => slot.id === selectedSlotId)?.booked ?? 1} max={100} step={1} value={newCapacity} onChange={(e) => setNewCapacity(Number(e.target.value))} required /></label>
          <button className={s.orangeButton} type="submit">Save capacity</button>
        </form>
      </section></div>}

      {selectedOrder && <div className={s.modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}><section role="dialog" aria-modal="true" aria-labelledby="detail-title" className={s.modal}>
        <div className={s.modalHead}><div><span className={s.eyebrow}>ORDER DETAILS</span><h2 id="detail-title">{selectedOrder.id}</h2></div><button type="button" aria-label="Close dialog" onClick={() => setSelectedId(null)}><X size={19}/></button></div>
        
        <dl className={s.detailsList}><div><dt>Customer</dt><dd>{selectedOrder.customer}</dd></div><div><dt>Product</dt><dd>{selectedOrder.quantity} × {selectedOrder.product}</dd></div><div><dt>Pickup time</dt><dd>{selectedOrder.pickupTime}</dd></div><div><dt>Order total</dt><dd>{money(selectedOrder.quantity * selectedOrder.unitPrice)}</dd></div><div><dt>Status</dt><dd>{statusLabels[selectedOrder.status]}</dd></div></dl>
        {followingStage[selectedOrder.status] ? <button type="button" className={s.orangeButton} onClick={() => advanceOrder(selectedOrder)}><CheckCircle2 size={18}/> Mark {statusLabels[followingStage[selectedOrder.status]!]}</button> : <p className={s.completeHint}><CheckCircle2 size={18}/> This order is complete.</p>}
      </section></div>}
    </div>
  );
}
