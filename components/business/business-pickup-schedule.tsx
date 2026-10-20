"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, BarChart3, CalendarClock, CheckCircle2, ChevronLeft,
  ChevronRight, CircleAlert, ClipboardList, Clock3, Coffee, LayoutDashboard,
  Lock, Menu, RefreshCcw, Save, Settings, ShieldCheck, SlidersHorizontal,
  UsersRound, X, Plus, Ban,
} from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import { BusinessShopDetails } from "./business-shop-details";
import {
  BUSINESS_CHANGED_EVENT, BUSINESS_CAPACITY_STORAGE, BUSINESS_ORDER_STORAGE, BUSINESS_STATUS_STORAGE,
  readDemoSlots, safeWriteJson, type BusinessDemoOrder, type DemoPickupSlot,
} from "./demo-business-data";
import {
  getBusinessHoursForDate, isPickupSlotWithinHours, readBusinessSettings,
} from "./business-settings-data";
import {
  addDays, buildSchedule, dateKey, localDate, readAllOwnerOrders,
  readPickupBlocks, readPickupRules, readableDate, savePickupBlocks,
  savePickupRules, slotStorageKey, TIME_LABELS, weekStart,
  type PickupBlocks, type PickupRules,
} from "./pickup-demo-data";
import shell from "./dashboard.module.css";
import s from "./pickup-schedule.module.css";

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { name: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { name: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { name: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { name: "Customers", icon: UsersRound, href: "/business/customers", batch: 5 },
  { name: "Analytics", icon: BarChart3, href: "/business/analytics", batch: 6 },
  { name: "Settings", icon: Settings, href: "/business/settings", batch: 8 },
] as const;

const statusNames: Record<BusinessDemoOrder["status"], string> = {
  queued: "Queued", preparing: "Preparing", ready: "Ready",
  collected: "Completed", cancelled: "Cancelled",
};

function avatar(email: string): string {
  return (email.split("@")[0] || "SB").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB";
}
function slotPercent(booked: number, capacity: number): number {
  return Math.min(100, Math.max(0, Math.round((booked / Math.max(1, capacity)) * 100)));
}

export function BusinessPickupSchedule({ email }: { email: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [view, setView] = useState<"day" | "week">("day");
  const [orders, setOrders] = useState<BusinessDemoOrder[]>([]);
  const [capacitySlots, setCapacitySlots] = useState<DemoPickupSlot[]>([]);
  const [blocks, setBlocks] = useState<PickupBlocks>({});
  const [rules, setRules] = useState<PickupRules>({ maxPerSlot: 25, bufferMinutes: 5 });
  const [draftLimit, setDraftLimit] = useState(25);
  const [draftBuffer, setDraftBuffer] = useState(5);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [blockTime, setBlockTime] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("Equipment maintenance");
  const [adjustTime, setAdjustTime] = useState<string | null>(null);
  const [adjustCapacity, setAdjustCapacity] = useState(25);
  const [businessHours, setBusinessHours] = useState(readBusinessSettings().operatingHours);

  useEffect(() => {
    const iso = dateKey(new Date());
    setToday(iso);
    setSelectedDate(iso);
    const load = () => {
      setOrders(readAllOwnerOrders());
      setCapacitySlots(readDemoSlots());
      setBusinessHours(readBusinessSettings().operatingHours);
      setBlocks(readPickupBlocks());
      const r = readPickupRules();
      setRules(r);
      setDraftLimit(r.maxPerSlot);
      setDraftBuffer(r.bufferMinutes);
    };
    load();
    setHydrated(true);
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    window.addEventListener(BUSINESS_CHANGED_EVENT, load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener("focus", load); window.removeEventListener(BUSINESS_CHANGED_EVENT, load); };
  }, []);

  useEffect(() => {
    if (!mobileMenu && !blockTime && !adjustTime) return;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobileMenu(false); setBlockTime(null); setAdjustTime(null); }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [mobileMenu, blockTime, adjustTime]);

  const baseSlots = useMemo(() => selectedDate && today
    ? buildSchedule(selectedDate, today, orders, capacitySlots, blocks, rules)
    : [], [selectedDate, today, orders, capacitySlots, blocks, rules]);
  const slots = useMemo(() => {
    if (!selectedDate) return baseSlots;
    const hours = getBusinessHoursForDate(selectedDate, businessHours);
    return baseSlots.map(row => {
      if (isPickupSlotWithinHours(selectedDate, row.label, businessHours)) return row;
      return { ...row, outsideOperatingHours: true, blockedReason: hours.closed ? "Business closed" : "Outside operating hours" };
    });
  }, [baseSlots, selectedDate, businessHours]);
  const weekDays = useMemo(() => selectedDate
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart(selectedDate), i))
    : [], [selectedDate]);
  const daySummaries = useMemo(() => weekDays.map(day => {
    const hours = getBusinessHoursForDate(day, businessHours);
    const daySlots = buildSchedule(day, today, orders, capacitySlots, blocks, rules).map(row => {
      if (isPickupSlotWithinHours(day, row.label, businessHours)) return row;
      return { ...row, outsideOperatingHours: true, blockedReason: hours.closed ? "Business closed" : "Outside operating hours" };
    });
    return { day, slots: daySlots };
  }), [weekDays, today, orders, capacitySlots, blocks, rules, businessHours]);
  const bookedTotal = slots.reduce((sum, item) => sum + item.booked, 0);
  const blockedTotal = slots.filter(item => item.blockedReason).length;
  const peakSlot = slots.reduce<typeof slots[number] | null>((peak, slot) => (!peak || slot.booked > peak.booked ? slot : peak), null);
  const visibleOrders = slots.reduce((sum, slot) => sum + slot.orderCards.length, 0);
  const invalidSelectedDate = !hydrated || !selectedDate;

  function isPickupSlotOutsideHours(row: (typeof slots)[number]): boolean {
    return "outsideOperatingHours" in row && row.outsideOperatingHours === true;
  }

  function showBlockDialog(time: string) {
    const row = slots.find(slot => slot.label === time);
    if (!row) return;
    if (isPickupSlotOutsideHours(row)) {
      setNotice(`${time} is unavailable under the saved business operating hours. Update hours in Settings to change availability.`);
      return;
    }
    if (row.booked > 0) {
      setNotice(`Cannot block ${time}: it already has ${row.booked} illustrative bookings. Clear bookings in the real backend before blocking an occupied slot.`);
      return;
    }
    setBlockReason("Equipment maintenance");
    setBlockTime(time);
  }

  function saveBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDate || !blockTime) return;
    const text = blockReason.trim().slice(0, 80);
    if (!text) { setNotice("Please enter a short reason for blocking this time."); return; }
    const key = slotStorageKey(selectedDate, blockTime);
    const updated = { ...blocks, [key]: text };
    setBlocks(updated);
    savePickupBlocks(updated);
    setNotice(`${blockTime} on ${readableDate(selectedDate, false)} blocked for this browser demo.`);
    setBlockTime(null);
  }

  function unblock(time: string) {
    const updated = { ...blocks };
    delete updated[slotStorageKey(selectedDate, time)];
    setBlocks(updated);
    savePickupBlocks(updated);
    setNotice(`Removed the test block from ${time}.`);
  }

  function saveRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isInteger(draftLimit) || draftLimit < 1 || draftLimit > 100 || ![0, 5, 10, 15].includes(draftBuffer)) {
      setNotice("Enter a maximum of 1 to 100 orders and a valid rush buffer."); return;
    }
    // The legacy Dashboard shows these five 20-minute buckets, so keep its capacity data synchronized.
    const minimum = Math.max(...capacitySlots.map(slot => {
      const matched = slots.find(row => row.id === slot.id);
      return Math.max(slot.booked, matched?.booked ?? slot.booked);
    }), 0);
    if (draftLimit < minimum && selectedDate === today) {
      setNotice(`Maximum orders cannot be below ${minimum} because existing test bookings already occupy the busiest Dashboard slot.`);
      return;
    }
    const updated: PickupRules = { maxPerSlot: draftLimit, bufferMinutes: draftBuffer };
    setRules(updated); savePickupRules(updated);
    if (capacitySlots.length) {
      const next = capacitySlots.map(slot => ({ ...slot, capacity: Math.max(draftLimit, slot.booked) }));
      setCapacitySlots(next); safeWriteJson(BUSINESS_CAPACITY_STORAGE, next);
    }
    setNotice("Pickup rules saved locally. Dashboard capacity bars will reflect the new limit when reopened.");
  }

  function openAdjust(time: string) {
    const row = slots.find(slot => slot.label === time);
    if (!row?.id || selectedDate !== today) return;
    setAdjustCapacity(row.capacity);
    setAdjustTime(time);
  }

  function saveAdjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const row = slots.find(slot => slot.label === adjustTime);
    if (!row || !row.id) return;
    if (!Number.isInteger(adjustCapacity) || adjustCapacity < row.booked || adjustCapacity > 100) {
      setNotice(`Capacity must be an integer from ${row.booked} to 100.`); return;
    }
    const updated = capacitySlots.map(slot => slot.id === row.id ? { ...slot, capacity: adjustCapacity } : slot);
    setCapacitySlots(updated);
    safeWriteJson(BUSINESS_CAPACITY_STORAGE, updated);
    setAdjustTime(null);
    setNotice(`Updated ${row.label} capacity to ${adjustCapacity} test orders. The Dashboard uses the same value.`);
  }

  function resetSchedule() {
    if (!window.confirm("Reset blocked slots and pickup rules to their original sample values? This will also reset the Dashboard slot capacities, but not order statuses.")) return;
    const defaults = readDemoSlots().map(slot => ({ ...slot, capacity: ({ s300: 20, s320: 25, s340: 25, s400: 25, s420: 25 } as Record<string, number>)[slot.id] ?? slot.capacity }));
    const restored: PickupRules = { maxPerSlot: 25, bufferMinutes: 5 };
    setBlocks({}); setRules(restored); setDraftLimit(25); setDraftBuffer(5);
    setCapacitySlots(defaults);
    savePickupBlocks({}); savePickupRules(restored);
    safeWriteJson(BUSINESS_CAPACITY_STORAGE, defaults);
    setNotice("Pickup blocks, rules, and Dashboard sample capacities were reset. Your test orders were kept.");
  }

  function navigate(days: number) { setSelectedDate(day => addDays(day, days)); }

  return (
    <div className={`${shell.workspace} ${s.workspace}`}>
      {mobileMenu && <button type="button" className={shell.mobileScrim} aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}
      <aside className={`${shell.sidebar} ${mobileMenu ? shell.sidebarOpen : ""}`} aria-label="Business owner navigation">
        <div className={shell.sideBrand}>
          <Link href="/business" className={shell.brandLink} onClick={() => setMobileMenu(false)}>
            <span className={shell.trcBadge}>TR<span>C</span></span>
            <span><strong>Schedu<span>Brew</span></strong><small>OWNER WORKSPACE</small></span>
          </Link>
          <button type="button" className={shell.closeSide} onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={20}/></button>
        </div>
        <nav className={shell.sideNavigation} aria-label="Business modules">
          {nav.map(({ name, icon: Icon, href, batch }) => href ?
            <Link key={name} href={href} aria-current={batch === 3 ? "page" : undefined} className={`${shell.sideItem} ${batch === 3 ? shell.sideActive : ""}`} onClick={() => setMobileMenu(false)}><Icon size={18}/><span>{name}</span></Link>
            : <button type="button" key={name} className={shell.sideItem} onClick={() => { setMobileMenu(false); setNotice(`${name} will be developed in Business Batch ${batch}.`); }}><Icon size={18}/><span>{name}</span><small>Later</small></button>
          )}
        </nav>
        <div className={shell.sideFoot}>
          <div className={shell.sideFootTitle}><ShieldCheck size={17}/> Balanced pickup times</div>
          <p>Review example booking loads and configure test pickup rules.</p>
          <span>Frontend test workspace · Batch 3</span>
        </div>
      </aside>

      <div className={shell.mainArea}>
        <header className={shell.topbar}>
          <div className={shell.topLeft}>
            <button type="button" className={shell.mobileMenu} onClick={() => setMobileMenu(true)} aria-label="Open business navigation"><Menu size={21}/></button>
            <BusinessShopDetails />
          </div>
          <div className={shell.topRight}>
            <span className={shell.datePill}><CalendarClock size={14}/>{today ? readableDate(today, false) : "Today"}</span>
            <span className={shell.demoTopBadge}><span/> Test mode</span>
            <div className={shell.avatar} title={email} aria-label="Signed in user">{avatar(email)}</div>
            <Logout />
          </div>
        </header>
        <main className={s.main}>
          <div className={s.headline}>
            <div><span className={s.eyebrow}>CAPACITY PLANNER</span><h1>Pickup schedule</h1><p>Control how many orders can land in each pickup window.</p></div>
            <div className={s.headActions}>
              <button type="button" className={s.mutedButton} onClick={() => setView(view === "day" ? "week" : "day")}><CalendarClock size={16}/>{view === "day" ? "Week view" : "Day view"}</button>
              <button type="button" className={s.orangeButton} disabled={invalidSelectedDate} onClick={() => showBlockDialog(slots.find(row => !row.blockedReason && row.booked === 0)?.label ?? TIME_LABELS[0])}><Plus size={16}/> Block time</button>
            </div>
          </div>
          <div className={s.testNote} role="note"><CircleAlert size={17}/><span>Test workspace only. The displayed bookings and dates are illustrative. Blocking time or changing capacity does not reserve slots, notify customers, or change live shop operations.</span></div>
          {notice && <div className={s.notice} role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={17}/></button></div>}

          <div className={s.overview} aria-label="Selected day overview">
            <div><span>Bookings shown</span><strong>{bookedTotal}</strong><small>Includes example baseline</small></div>
            <div><span>Open windows</span><strong>{slots.filter(slot => !slot.blockedReason && slot.remaining > 0).length}</strong><small>Out of {TIME_LABELS.length} windows</small></div>
            <div><span>Unavailable windows</span><strong>{blockedTotal}</strong><small>Saved on this browser</small></div>
            <div><span>Visible order cards</span><strong>{visibleOrders}</strong><small>From your Orders module</small></div>
          </div>

          <div className={s.layout}>
            <section className={s.scheduleCard} aria-labelledby="schedule-heading">
              <div className={s.calendarHeader}>
                <div><h2 id="schedule-heading">{selectedDate ? readableDate(selectedDate, view === "day") : "Loading schedule..."}</h2><p>{view === "day" ? "20-minute pickup windows" : "7-day planning overview"}</p></div>
                <div className={s.calendarControls}>
                  <button type="button" className={s.todayButton} onClick={() => setSelectedDate(today)} disabled={!today}>Today</button>
                  <button type="button" aria-label="Previous date" onClick={() => navigate(view === "day" ? -1 : -7)} disabled={!selectedDate}><ChevronLeft size={18}/></button>
                  <input type="date" aria-label="Choose pickup date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                  <button type="button" aria-label="Next date" onClick={() => navigate(view === "day" ? 1 : 7)} disabled={!selectedDate}><ChevronRight size={18}/></button>
                </div>
              </div>
              {view === "day" ? <div className={s.timeRows}>
                {slots.map(row => {
                  const pct = slotPercent(row.booked, row.capacity);
                  const full = row.booked >= row.capacity;
                  return <div key={row.label} className={`${s.slotRow} ${row.blockedReason ? s.blockedRow : ""} ${pct >= 90 ? s.busyRow : ""}`}>
                    <time className={s.slotTime}>{row.label}</time>
                    <div className={s.slotContent}>
                      <div className={s.slotTop}><span className={s.slotHeading}>{isPickupSlotOutsideHours(row) ? <><Lock size={13}/> Unavailable: {row.blockedReason}</> : row.blockedReason ? <><Lock size={13}/> Blocked: {row.blockedReason}</> : row.booked === 0 ? "Open capacity" : `${row.booked} of ${row.capacity} bookings`}</span><span className={s.slotCapacity}>{row.blockedReason ? "Unavailable" : full ? "Full" : `${row.remaining} left`}</span></div>
                      {!row.blockedReason && <div className={s.progressTrack} role="progressbar" aria-label={`${row.label} load`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div style={{ width: `${pct}%` }}/></div>}
                      {row.orderCards.length > 0 && <div className={s.orderChips}>{row.orderCards.map(order => <Link href="/business/orders" key={order.id} className={s.orderChip} title={`See ${order.id} in Orders`}>{order.id} · {order.quantity} item{order.quantity > 1 ? "s" : ""} <span>{statusNames[order.status]}</span></Link>)}</div>}
                      {row.booked > row.orderCards.length && !row.blockedReason && <p className={s.mutedHint}>Other bookings are illustrative baseline data.</p>}
                    </div>
                    <div className={s.rowActions}>{isPickupSlotOutsideHours(row) ? <span className={s.mutedHint}>Hours rule</span> : row.blockedReason ? <button className={s.unblockButton} type="button" onClick={() => unblock(row.label)}>Unblock</button> : <button className={s.smallButton} type="button" onClick={() => showBlockDialog(row.label)} disabled={row.booked > 0} title={row.booked > 0 ? "Cannot block a booked sample slot" : "Block this time"}><Ban size={13}/> Block</button>}
                      {row.id && selectedDate === today && !row.blockedReason && <button className={s.smallButton} type="button" onClick={() => openAdjust(row.label)}><SlidersHorizontal size={13}/> Capacity</button>}</div>
                  </div>;
                })}
              </div> : <div className={s.weekGrid}>
                {daySummaries.map(({ day, slots: weekSlots }) => {
                  const total = weekSlots.reduce((sum, row) => sum + row.booked, 0);
                  const unavailable = weekSlots.filter(row => row.blockedReason).length;
                  const ratio = Math.round(100 * total / Math.max(1, weekSlots.reduce((sum, row) => sum + row.capacity, 0)));
                  return <button key={day} type="button" className={`${s.weekDay} ${day === today ? s.weekToday : ""}`} onClick={() => { setSelectedDate(day); setView("day"); }}>
                    <span>{localDate(day).toLocaleDateString("en-PH", { weekday: "short" })}</span>
                    <strong>{localDate(day).getDate()}</strong>
                    <span>{total} shown bookings</span>
                    <div className={s.weekBar}><div style={{ width: `${Math.min(ratio,100)}%` }}/></div>
                    <small>{unavailable ? `${unavailable} unavailable` : "View schedule"}</small>
                  </button>;
                })}
              </div>}
              <footer className={s.scheduleFooter}><span>All windows and figures shown are for interface testing, not live reservations.</span><Link href="/business/orders">Manage order statuses <ArrowRight size={14}/></Link></footer>
            </section>

            <aside className={s.rightColumn} aria-label="Pickup rules and summary">
              <section className={s.sidePanel}>
                <div className={s.panelTitle}><SlidersHorizontal size={18}/><h2>Slot rules</h2></div>
                <form className={s.rulesForm} onSubmit={saveRules}>
                  <label>Window length <input type="text" value="20 minutes" disabled aria-describedby="window-explainer"/></label>
                  <p id="window-explainer" className={s.helpText}>Fixed to match the existing Dashboard and Orders test slots. Configurable intervals will be supported in the database phase.</p>
                  <label>Max orders per window <input type="number" min={1} max={100} value={draftLimit} onChange={e => setDraftLimit(Number(e.target.value))} required/></label>
                  <label>Rush buffer <select value={draftBuffer} onChange={e => setDraftBuffer(Number(e.target.value))}>{[0,5,10,15].map(n => <option value={n} key={n}>{n ? `+ ${n} minutes after 80% capacity` : "No additional buffer"}</option>)}</select></label>
                  <p className={s.helpText}>Rush buffer is a saved display preference; it does not automatically change customer pickup availability yet.</p>
                  <button className={s.orangeButton} type="submit" disabled={!hydrated}><Save size={16}/> Save rules</button>
                </form>
              </section>
              <section className={s.sidePanel}>
                <div className={s.panelTitle}><Clock3 size={18}/><h2>Today at a glance</h2></div>
                <dl className={s.summaryList}>
                  <div><dt>Booked slots</dt><dd>{bookedTotal} shown</dd></div>
                  <div><dt>Open windows</dt><dd>{slots.filter(slot => !slot.blockedReason && slot.remaining > 0).length}/{TIME_LABELS.length}</dd></div>
                  <div><dt>Peak window</dt><dd>{peakSlot && peakSlot.booked ? peakSlot.label : "No bookings"}</dd></div>
                  <div><dt>Unavailable windows</dt><dd>{blockedTotal}</dd></div>
                </dl>
                <p className={s.helpText}>Figures above refer to the selected day, not confirmed customer bookings.</p>
              </section>
              <button type="button" className={s.resetButton} onClick={resetSchedule} disabled={!hydrated}><RefreshCcw size={16}/> Reset sample schedule settings</button>
            </aside>
          </div>
          <footer className={s.footnote}>© ScheduBrew by The Ready Counter · Business frontend prototype · No live booking or merchant authorization</footer>
        </main>
      </div>

      {blockTime && <div className={s.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) setBlockTime(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="block-title" className={s.modal}>
          <div className={s.modalHead}><div><span className={s.eyebrow}>PICKUP TIME CONTROL</span><h2 id="block-title">Block {blockTime}</h2></div><button type="button" aria-label="Close block dialog" onClick={() => setBlockTime(null)}><X size={19}/></button></div>
          <p>This action marks one unused sample slot as unavailable on {readableDate(selectedDate)}. It is not a real reservation system.</p>
          <form onSubmit={saveBlock} className={s.modalForm}><label>Reason for blocking<input value={blockReason} onChange={e => setBlockReason(e.target.value)} maxLength={80} required autoFocus/></label><button type="submit" className={s.orangeButton}><Lock size={16}/> Block time in test schedule</button></form>
        </section>
      </div>}
      {adjustTime && <div className={s.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) setAdjustTime(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="adjust-title" className={s.modal}>
          <div className={s.modalHead}><div><span className={s.eyebrow}>CAPACITY CONTROL</span><h2 id="adjust-title">Update {adjustTime}</h2></div><button type="button" aria-label="Close capacity dialog" onClick={() => setAdjustTime(null)}><X size={19}/></button></div>
          <p>Adjust the same example capacity used in the Business Dashboard. Never set below its existing test bookings.</p>
          <form onSubmit={saveAdjust} className={s.modalForm}><label>Maximum orders for this window<input type="number" min={slots.find(slot => slot.label === adjustTime)?.booked ?? 1} max={100} step={1} value={adjustCapacity} onChange={e => setAdjustCapacity(Number(e.target.value))} required autoFocus/></label><button type="submit" className={s.orangeButton}><Save size={16}/> Save test capacity</button></form>
        </section>
      </div>}
    </div>
  );
}
