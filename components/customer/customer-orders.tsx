"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, Clock3, ClipboardList, Search, ShoppingBag, Trash2 } from "lucide-react";
import { peso, products, shops } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { formatSlot, readOrders, type DemoOrder } from "./demo-order-data";
import { clearDemoOrders, formattedOrderDate, formattedPickupDate, progressFor, trackingSteps, type DemoProgress } from "./demo-tracking-data";
import s from "./customer.module.css";
import t from "./orders-tracking.module.css";

type Filter = "all" | "active" | "complete";

export function CustomerOrders({ email }: { email: string }) {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [progress, setProgress] = useState<Record<string, DemoProgress>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = () => {
      const list = readOrders();
      setOrders(list);
      setProgress(Object.fromEntries(list.map(o => [o.id, progressFor(o)])));
      setLoading(false);
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener("schedu-demo-orders-updated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("schedu-demo-orders-updated", load);
    };
  }, []);

  const visible = useMemo(() => orders.filter(order => {
    const shop = shops.find(s => s.id === order.shopId);
    const stage = progress[order.id]?.step ?? 0;
    if (filter === "active" && stage === 3) return false;
    if (filter === "complete" && stage !== 3) return false;
    const search = query.trim().toLowerCase();
    return !search || `${order.id} ${shop?.name || ""}`.toLowerCase().includes(search);
  }), [orders, progress, filter, query]);

  function clearHistory() {
    if (!window.confirm("Delete all orders saved in this browser? This cannot be undone.")) return;
    try { clearDemoOrders(); } catch { window.alert("This browser could not clear order history."); }
  }

  return <div className={s.page}>
    <CustomerNav email={email} />
    <main className={s.container}>
      
      <div className={t.pageHeading}>
        <div><div className={t.breadcrumb}><Link href="/customer">Discover</Link><ChevronRight size={13}/> My Orders</div><span className={t.eyebrow}>MY ORDERS</span><h1>Your orders</h1><p>Keep track of your orders and pickup progress.</p></div>
        <Link href="/customer#browse" className={t.primaryLink}><ShoppingBag size={17}/> Start an Order</Link>
      </div>
      <div className={t.summaryTiles}>
        <div className={t.statTile}><ShoppingBag size={18}/><div><b>{orders.length}</b><span>Orders</span></div></div>
        <div className={t.statTile}><Clock3 size={18}/><div><b>{orders.filter(o => (progress[o.id]?.step ?? 0) < 3).length}</b><span>Active Orders</span></div></div>
        <div className={t.statTile}><ClipboardList size={18}/><div><b>{orders.filter(o => (progress[o.id]?.step ?? 0) === 3).length}</b><span>Completed Orders</span></div></div>
      </div>
      <div className={t.toolbar}>
        <div className={t.tabs} role="group" aria-label="Order status filter">
          {(["all", "active", "complete"] as const).map(item => <button type="button" key={item} onClick={() => setFilter(item)} className={filter === item ? t.currentTab : ""} aria-pressed={filter === item}>{item === "all" ? "All Orders" : item === "active" ? "Active" : "Completed"}</button>)}
        </div>
        <label className={t.searchBox}><Search size={16}/><input aria-label="Search orders" value={query} placeholder="Search reference or shop..." onChange={e => setQuery(e.target.value)}/></label>
      </div>
      {loading ? <div className={t.empty}>Loading your orders…</div> : orders.length === 0 ?
        <div className={t.empty}><div className={t.emptyIcon}><ShoppingBag size={27}/></div><h2>You have no orders yet</h2><p>Discover shops and add your favorite items to get started.</p><Link href="/customer#browse" className={t.primaryLink}>Explore shops <ArrowRight size={16}/></Link></div> :
        <>
          {visible.length === 0 ? <div className={t.empty}><h2>No orders match your search</h2><p>Try another status filter or reference.</p><button type="button" className={t.textButton} onClick={() => { setFilter("all"); setQuery(""); }}>Reset filters</button></div> :
          <div className={t.orderList}>{visible.map(order => {
            const shop = shops.find(s => s.id === order.shopId);
            const stage = progress[order.id]?.step ?? 0;
            const lines = order.lines.flatMap(line => {
              const p = products.find(p => p.id === line.productId && p.shopId === order.shopId);
              return p ? [{ ...p, quantity: line.quantity }] : [];
            });
            const count = lines.reduce((n, p) => n + p.quantity, 0);
            return <article key={order.id} className={t.orderCard}>
              <div className={t.orderTop}><div className={t.orderShop}><div className={t.miniShopIcon}><ShoppingBag size={18}/></div><div><h2>{shop?.name || "Shop unavailable"}</h2><p>{order.id} · Placed {formattedOrderDate(order.createdAt)}</p></div></div><span className={`${t.status} ${stage === 3 ? t.statusDone : stage === 2 ? t.statusReady : t.statusActive}`}>{trackingSteps[stage].label}</span></div>
              <div className={t.orderMiddle}><div className={t.thumbStack}>{lines.slice(0, 3).map(p => <Image key={p.id} src={p.image} alt={p.name} width={64} height={64}/>)}</div><div className={t.orderDescription}><b>{lines.slice(0, 2).map(p => p.name).join(", ")}{lines.length > 2 ? ` +${lines.length - 2} more` : ""}</b><p>{count} item{count !== 1 ? "s" : ""} · Pay at counter</p></div><div className={t.orderAmount}><b>{peso(order.total)}</b><span>Total</span></div></div>
              <div className={t.orderBottom}><div className={t.pickupText}><CalendarDays size={16}/> Pickup: {formattedPickupDate(order.pickupDate)} at {formatSlot(order.pickupTime)}</div><Link className={t.outlinedLink} href={`/customer/orders/${encodeURIComponent(order.id)}`}>Track Order <ArrowRight size={15}/></Link></div>
            </article>;
          })}</div>}
          <div className={t.clearRow}><span>Test mode: orders are saved only in this browser and are not sent to shops.</span><button type="button" className={t.clearButton} onClick={clearHistory}><Trash2 size={14}/> Clear order history</button></div>
        </>}
    </main>
  </div>;
}
