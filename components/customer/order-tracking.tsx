"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Clock3, Coffee, Copy, MapPin, PackageCheck, RotateCcw, ShoppingBag, TicketCheck } from "lucide-react";
import { peso, products, shops } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { formatSlot, readOrders, type DemoOrder } from "./demo-order-data";
import { formattedOrderDate, formattedPickupDate, progressFor, progressTo, trackingSteps, type DemoProgress, type DemoStep } from "./demo-tracking-data";
import s from "./customer.module.css";
import t from "./orders-tracking.module.css";

export function OrderTracking({ email, reference }: { email: string; reference: string }) {
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [progress, setProgress] = useState<DemoProgress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy reference");

  useEffect(() => {
    const load = () => {
      const found = readOrders().find(o => o.id === reference) || null;
      setOrder(found);
      setProgress(found ? progressFor(found) : null);
      setLoaded(true);
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener("schedu-demo-orders-updated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("schedu-demo-orders-updated", load);
    };
  }, [reference]);

  const shop = shops.find(item => item.id === order?.shopId);
  const lines = order?.lines.flatMap(line => {
    const product = products.find(p => p.id === line.productId && p.shopId === order.shopId);
    return product ? [{ ...product, quantity: line.quantity }] : [];
  }) || [];
  const stage = progress?.step ?? 0;
  const progressTime = (index: number) => progress?.events.find(e => e.step === index)?.at;

  function simulateNext() {
    if (!order || busy || stage >= 3) return;
    setBusy(true);
    try {
      const result = progressTo(order, (stage + 1) as DemoStep);
      setProgress(result);
      setStatusMessage(`Order status changed to ${trackingSteps[result.step].label}.`);
    } catch { setStatusMessage("Browser storage was unavailable. Please try again."); }
    finally { setBusy(false); }
  }

  function resetDemo() {
    if (!order || busy) return;
    setBusy(true);
    try {
      setProgress(progressTo(order, 0));
      setStatusMessage("Order progress reset to Confirmed.");
    } catch { setStatusMessage("Could not reset order progress. Please try again."); }
    finally { setBusy(false); }
  }

  async function copyReference() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.id);
      setCopyLabel("Copied!");
    } catch { setCopyLabel("Select reference to copy"); }
  }

  if (!loaded) return <div className={s.page}><CustomerNav email={email}/><main className={s.container}><div className={t.empty}>Loading your order…</div></main></div>;

  if (!order) return <div className={s.page}><CustomerNav email={email}/><main className={s.container}><div className={t.empty}><ShoppingBag size={35}/><h1>Order not found</h1><p>It may have been deleted, created in another browser, or the reference is incorrect.</p><Link className={t.primaryLink} href="/customer/orders">View My Orders <ArrowRight size={15}/></Link></div></main></div>;

  return <div className={s.page}>
    <CustomerNav email={email}/>
    <main className={s.container}>
      
      <div className={t.pageHeading}>
        <div><div className={t.breadcrumb}><Link href="/customer/orders">My Orders</Link><ChevronRight size={13}/><span>{order.id}</span></div><span className={t.eyebrow}>ORDER TRACKING</span><h1>Track your order</h1><p>Follow your order through each preparation stage.</p></div>
        <Link href="/customer/orders" className={t.outlinedLink}><ArrowLeft size={16}/> Back to My Orders</Link>
      </div>
      <div className={t.trackingLayout}>
        <div className={t.mainColumn}>
          <section className={t.surface}>
            <div className={t.trackingTop}>
              <div><span className={t.mutedLabel}>Selected pickup</span><h2 className={t.pickupTitle}>{formattedPickupDate(order.pickupDate)} · {formatSlot(order.pickupTime)}</h2></div>
              <div className={t.orderRef}><span>ORDER REFERENCE</span><strong>{order.id}</strong><button type="button" onClick={copyReference}><Copy size={14}/> {copyLabel}</button></div>
            </div>
            <div className={t.timeline} aria-label="Order status progression">
              {trackingSteps.map((step, i) => <div key={step.key} className={`${t.step} ${i < stage ? t.stepPassed : ""} ${i === stage ? t.stepCurrent : ""}`}>
                <div className={t.stepMarker}>{i < stage ? <Check size={16}/> : i + 1}</div>
                <b>{step.label}</b><small>{i <= stage ? progressTime(i) ? new Date(progressTime(i)!).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }) : "Updated" : "Coming next"}</small>
              </div>)}
            </div>
            <div className={t.statusArea}><span className={`${t.status} ${stage === 3 ? t.statusDone : stage === 2 ? t.statusReady : t.statusActive}`}>{trackingSteps[stage].label}</span><p>{trackingSteps[stage].detail}</p></div>
            <div className={t.demoControls}>
              <div><strong>Order progress</strong><p>Review the current status and pickup progress.</p></div>
              <div className={t.actionGroup}><button type="button" className={t.secondaryButton} disabled={busy || stage === 0} onClick={resetDemo}><RotateCcw size={15}/> Reset</button><button type="button" className={t.primaryButton} disabled={busy || stage === 3} onClick={simulateNext}>{stage === 3 ? "Picked up" : `Update to ${trackingSteps[stage + 1].label}`}<ArrowRight size={15}/></button></div>
            </div>
            {statusMessage && <p className={t.inlineNotice} role="status">{statusMessage}</p>}
          </section>
          <div className={t.twoPanel}>
            <section className={t.surface}>
              <div className={t.panelHeading}><Coffee size={22}/><div><h2>Preparation updates</h2><p>Order status updates and preparation progress.</p></div></div>
              <div className={t.updateList}>
                {trackingSteps.map((step, i) => <div key={step.key} className={`${t.update} ${i > stage ? t.upcomingUpdate : ""}`}><div className={t.updateIcon}>{i <= stage ? <Check size={16}/> : <Clock3 size={16}/>}</div><div><b>{step.label}</b><p>{step.detail}</p></div><small>{i <= stage ? (progressTime(i) ? new Date(progressTime(i)!).toLocaleTimeString("en-PH", {hour:"numeric",minute:"2-digit"}) : "Pending") : "Not started"}</small></div>)}
              </div>
            </section>
            <section className={t.surface}>
              <div className={t.panelHeading}><TicketCheck size={22}/><div><h2>Your pickup pass</h2><p>Available when the order is ready.</p></div></div>
              {stage >= 2 ? <div className={t.qrSection}>
                <div className={t.qrWrap}><QRCodeSVG value={`SCHEDUBREW|${order.id}|NOT-VALID-FOR-PICKUP`} size={180} level="M" title={`Pickup reference QR code for ${order.id}`} includeMargin /></div>
                <span className={t.qrWarning}>PICKUP VERIFICATION UNAVAILABLE</span>
                <strong>{order.id}</strong>
                <p>Pickup verification is not available for this order yet.</p>
                {stage === 3 && <div className={t.finishedNotice}><CheckCircle2 size={17}/> Pickup marked complete</div>}
              </div> : <div className={t.qrPlaceholder}><div><PackageCheck size={42}/></div><b>Pickup pass not ready</b><p>The pickup pass will appear when the order is ready.</p></div>}
            </section>
          </div>
          <section className={t.locationStrip}><MapPin size={21}/><div><b>{shop?.name || "Shop unavailable"}</b><p>{shop?.location || "Location unavailable"} · Location not yet verified</p></div><Link href={`/customer/shops/${encodeURIComponent(order.shopId)}`} className={t.textButton}>View shop <ArrowRight size={15}/></Link></section>
        </div>
        <aside className={t.summaryColumn}>
          <section className={t.surface}>
            <div className={t.panelHeading}><ShoppingBag size={22}/><div><h2>Order summary</h2><p>{shop?.name || "Shop unavailable"} · {lines.reduce((n,p)=>n+p.quantity,0)} items</p></div></div>
            <div className={t.items}>{lines.map(p => <div key={p.id} className={t.item}><Image src={p.image} width={58} height={58} alt={p.name}/><div><b>{p.name}</b><span>Quantity: {p.quantity}</span></div><strong>{peso(p.price * p.quantity)}</strong></div>)}</div>
            <div className={t.rule}/>
            <div className={t.billRow}><span>Subtotal</span><b>{peso(order.subtotal)}</b></div>
            <div className={t.billRow}><span>Service fee</span><b>{peso(order.demoServiceFee)}</b></div>
            <div className={`${t.billRow} ${t.total}`}><strong>Total</strong><strong>{peso(order.total)}</strong></div>
            <div className={t.summaryDetails}><div><span>Payment selection</span><b>Pay at counter</b></div><div><span>Order created</span><b>{formattedOrderDate(order.createdAt)}</b></div><div><span>Pickup schedule</span><b>{formattedPickupDate(order.pickupDate)} · {formatSlot(order.pickupTime)}</b></div></div>
            
          </section>
        </aside>
      </div>
    </main>
  </div>;
}
