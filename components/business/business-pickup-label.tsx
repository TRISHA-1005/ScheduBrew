"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import {
  readDemoStatuses, readExtraOrders, sampleOrders, money,
  type BusinessDemoOrder,
} from "./demo-business-data";
import styles from "./pickup-label.module.css";

export function BusinessPickupLabel({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<BusinessDemoOrder | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const overrides = readDemoStatuses();
    const all = [...readExtraOrders(), ...sampleOrders.map(item => ({ ...item, status: overrides[item.id] ?? item.status }))];
    setOrder(all.find(item => item.id === orderId) ?? null);
    setReady(true);
  }, [orderId]);

  return <main className={styles.page}>
    <div className={styles.toolbar}>
      <Link href="/business/orders"><ArrowLeft size={17}/> Back to Orders</Link>
      <button type="button" onClick={() => window.print()} disabled={!order}><Printer size={17}/> Print pickup label</button>
    </div>
    {!ready && <p>Loading order...</p>}
    {ready && !order && <section className={styles.label}><h1>Order not available</h1><p>This order was not found. Open Orders and select an existing order.</p></section>}
    {order && <section className={styles.label} aria-label="Pickup label">
      <div className={styles.brand}>TRC <strong>Schedu<span>Brew</span></strong></div>
      <div className={styles.watermark}>PICKUP VERIFICATION UNAVAILABLE</div>
      <h1>Pickup label</h1>
      <p className={styles.shop}>Brewed Awakenings · Main Branch</p>
      <div className={styles.code}>{order.id}</div>
      <dl className={styles.details}>
        <div><dt>Customer</dt><dd>{order.customer}</dd></div>
        <div><dt>Items</dt><dd>{order.quantity} × {order.product}</dd></div>
        <div><dt>Pickup time</dt><dd>{order.pickupTime}</dd></div>
        <div><dt>Amount</dt><dd>{money(order.quantity * order.unitPrice)}</dd></div>
        <div><dt>Current stage</dt><dd>{order.status === "collected" ? "Completed" : order.status}</dd></div>
      </dl>
      <div className={styles.disclaimer}>No purchase, payment, pickup reservation, or customer verification has occurred.</div>
    </section>}
  </main>;
}
