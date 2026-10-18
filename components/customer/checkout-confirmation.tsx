"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { shops, peso } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { formatSlot, readOrders, type DemoOrder } from "./demo-order-data";
import s from "./customer.module.css";
import c from "./cart-checkout.module.css";

export function CheckoutConfirmation({ email, reference }: { email: string; reference: string }) {
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setOrder(readOrders().find(o => o.id === reference) || null);
    setLoaded(true);
  }, [reference]);
  const shop = shops.find(s => s.id === order?.shopId);
  return <div className={s.page}>
    <CustomerNav email={email}/>
    <main className={s.container}>
      <div className={s.demoNotice}>FRONTEND PREVIEW <span>No real order was placed. This confirmation exists only in your browser.</span></div>
      <div className={c.confirmation}>
        {!loaded ? <p>Loading demonstration receipt…</p> : !order ?
          <section className={c.emptyCard}><ShoppingBag size={38}/><h2>Demo receipt not found</h2><p>It may have been cleared from this browser, or the link is no longer valid.</p><Link href="/customer" className={c.primaryButton}>Return to Discover</Link></section> :
          <section className={c.card}>
            <div className={c.center}><div className={c.confirmedIcon}><CheckCircle2 size={42}/></div><p className={c.kicker}>DEMONSTRATION COMPLETE</p><h1 style={{fontSize:27,margin:"0 0 10px"}}>Your sample order is saved</h1><p style={{color:"#8792a4",fontSize:13,marginBottom:18}}>This is a browser only demonstration. Do not visit the shop expecting an order.</p><span className={c.pill}>Not submitted to a merchant</span></div>
            <div className={c.rule}/>
            <div className={c.keyValue}><span>Demo reference</span><strong>{order.id}</strong></div>
            <div className={c.keyValue}><span>Sample shop</span><strong>{shop?.name || "Sample shop"}</strong></div>
            <div className={c.keyValue}><span>Selected pickup date</span><strong>{order.pickupDate}</strong></div>
            <div className={c.keyValue}><span>Selected pickup time</span><strong>{formatSlot(order.pickupTime)} (sample)</strong></div>
            <div className={c.keyValue}><span>Payment selection</span><strong>Pay at counter (not processed)</strong></div>
            <div className={c.keyValue}><span>Illustrative total</span><strong>{peso(order.total)}</strong></div>
            <div className={c.rule}/>
            <p className={c.statusNotice}>Batch 4 includes browser only progress simulation and a demo QR code. Real shop notification, verified QR pickup, and reserved capacity still require backend integration.</p>
            <div className={c.inlineActions}><Link href={`/customer/orders/${encodeURIComponent(order.id)}`} className={c.primaryButton}>Track demo order →</Link><Link href="/customer/orders" className={c.secondaryButton}>View My Orders</Link><Link href="/customer" className={c.secondaryButton}>Continue browsing</Link></div>
          </section>}
      </div>
    </main>
  </div>;
}
