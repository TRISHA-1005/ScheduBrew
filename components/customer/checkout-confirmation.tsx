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
      
      <div className={c.confirmation}>
        {!loaded ? <p>Loading order confirmation…</p> : !order ?
          <section className={c.emptyCard}><ShoppingBag size={38}/><h2>Order not found</h2><p>It may have been cleared from this browser, or the link is no longer valid.</p><Link href="/customer" className={c.primaryButton}>Return to Discover</Link></section> :
          <section className={c.card}>
            <div className={c.center}><div className={c.confirmedIcon}><CheckCircle2 size={42}/></div><p className={c.kicker}>ORDER SAVED</p><h1 style={{fontSize:27,margin:"0 0 10px"}}>Your order has been saved</h1><p style={{color:"#8792a4",fontSize:13,marginBottom:18}}>Test mode: Your order is stored only on this device and was not sent to the shop.</p><span className={c.pill}>Not sent to shop</span></div>
            <div className={c.rule}/>
            <div className={c.keyValue}><span>Order reference</span><strong>{order.id}</strong></div>
            <div className={c.keyValue}><span>Shop</span><strong>{shop?.name || "Shop unavailable"}</strong></div>
            <div className={c.keyValue}><span>Selected pickup date</span><strong>{order.pickupDate}</strong></div>
            <div className={c.keyValue}><span>Selected pickup time</span><strong>{formatSlot(order.pickupTime)}</strong></div>
            <div className={c.keyValue}><span>Payment selection</span><strong>Pay at counter (not processed)</strong></div>
            <div className={c.keyValue}><span>Total</span><strong>{peso(order.total)}</strong></div>
            <div className={c.rule}/>
            <p className={c.statusNotice}>Test mode: Tracking and the pickup QR are simulations. No real pickup can be made using this order.</p>
            <div className={c.inlineActions}><Link href={`/customer/orders/${encodeURIComponent(order.id)}`} className={c.primaryButton}>Track Order →</Link><Link href="/customer/orders" className={c.secondaryButton}>View My Orders</Link><Link href="/customer" className={c.secondaryButton}>Continue browsing</Link></div>
          </section>}
      </div>
    </main>
  </div>;
}
