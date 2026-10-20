"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CreditCard, Gift, Leaf, LockKeyhole, ShoppingBag, ShieldCheck, UserRound } from "lucide-react";
import { peso } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { cartDetail, demoDates, demoSlots, emptyCart, formatSlot, readCart, SAMPLE_SERVICE_FEE, saveCart, saveDemoOrder, type DemoCart, type DemoOrder } from "./demo-order-data";
import s from "./customer.module.css";
import c from "./cart-checkout.module.css";

type Payment = "gcash" | "maya" | "card" | "counter";
const methods: { id: Payment; title: string; description: string }[] = [
  { id: "gcash", title: "GCash", description: "Preview only" },
  { id: "maya", title: "Maya", description: "Preview only" },
  { id: "card", title: "Card", description: "Preview only" },
  { id: "counter", title: "Pay at counter", description: "Pay when you arrive" },
];

export function CheckoutPage({ email }: { email: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<DemoCart>(emptyCart());
  const [loaded, setLoaded] = useState(false);
  const [dates, setDates] = useState<{ key: string; label: string }[]>([]);
  const [date, setDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(email);
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<Payment>("counter");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCart(readCart());
    const choices = demoDates();
    setDates(choices);
    setDate(choices[0]?.key || "");
    setLoaded(true);
  }, []);
  const { shop, lines, subtotal, count } = cartDetail(cart);
  const slots = useMemo(() => date ? demoSlots(date) : [], [date]);
  const total = subtotal + (count ? SAMPLE_SERVICE_FEE : 0);
  function chooseDay(day: string) { setDate(day); setPickupTime(""); setError(""); }

  function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (submitting) return;
    if (!shop || !count) { setError("Your cart is empty. Add products first."); return; }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 90) { setError("Enter a full name between 2 and 90 characters."); return; }
    const cleanedPhone = phone.replace(/[\s()+-]/g, "");
    if (!/^(09\d{9}|639\d{9})$/.test(cleanedPhone)) { setError("Enter a valid Philippine mobile number, such as 09171234567."); return; }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) { setError("Enter a valid email address or leave it blank."); return; }
    if (!dates.some(d => d.key === date) || !pickupTime || !demoSlots(date).includes(pickupTime)) {
      setError("Select a pickup date and an available future time option."); return;
    }
    if (payment !== "counter") { setError("Online payments are not connected. Choose Pay at counter to continue."); return; }
    if (note.length > 400) { setError("Pickup notes must be 400 characters or fewer."); return; }

    setSubmitting(true);
    try {
      // No real checkout, booking, payment, message, or backend request takes place.
      const reference = `DEMO-${Date.now().toString(36).toUpperCase()}`;
      const order: DemoOrder = {
        id: reference, shopId: shop.id, lines: cart.lines, subtotal,
        demoServiceFee: SAMPLE_SERVICE_FEE, total, pickupDate: date, pickupTime,
        contactName: trimmedName, contactPhone: cleanedPhone, contactEmail: contactEmail.trim(),
        note: note.trim(), paymentMethod: "counter", createdAt: new Date().toISOString(),
      };
      saveDemoOrder(order);
      saveCart(emptyCart());
      router.push(`/customer/checkout/confirmation?ref=${encodeURIComponent(reference)}`);
    } catch {
      setError("Your browser could not save the order. Check that browser storage is enabled.");
      setSubmitting(false);
    }
  }

  return <div className={s.page}>
    <CustomerNav email={email}/>
    <main className={s.container}>
      
      <Link href="/customer/cart" className={s.backLink}><ArrowLeft size={15}/> Back to Cart</Link>
      <div className={c.heading}><p className={c.kicker}>CHECKOUT</p><h1>Reserve your pickup</h1><p>Choose your pickup time, review your cart, and enter contact details.</p></div>
      {!loaded ? <section className={c.emptyCard}>Loading checkout…</section> : !shop || !count ?
        <section className={c.emptyCard}><ShoppingBag size={38}/><h2>No items to check out</h2><p>Choose a shop and add items to your cart before continuing.</p><Link href="/customer#browse" className={c.primaryButton}>Discover shops</Link></section> :
        <form onSubmit={confirm} noValidate>
          <div className={`${c.layout} ${c.checkoutLayout}`}>
            <div className={c.checkoutFormScroll} role="region" aria-label="Pickup schedule, contact information and payment options" tabIndex={0}>
              <section className={c.card}>
                <div className={c.cardTitle}><CalendarDays className={c.cardTitleIcon}/><div><h2>1. Pickup schedule</h2><p>Select a pickup date and time.</p></div></div>
                <div className={c.field}><label htmlFor="demo-pickup-date">Pickup date</label>
                  <select id="demo-pickup-date" value={date} onChange={e => chooseDay(e.target.value)}>
                    {dates.map(d => <option key={d.key} value={d.key}>{d.label} · {d.key}</option>)}
                  </select>
                </div>
                <div className={c.field}><label>Available pickup times</label></div>
                {slots.length ? <div className={c.slotGrid}>{slots.slice(0, 15).map(slot => <button key={slot} type="button" className={`${c.slot} ${pickupTime === slot ? c.slotSelected : ""}`} aria-pressed={pickupTime === slot} onClick={() => { setPickupTime(slot); setError(""); }}>{formatSlot(slot)}</button>)}</div> : <div className={c.slotEmpty}>No pickup times remain today. Choose another date.</div>}
                
                {pickupTime && <p className={c.help}><strong>Selected:</strong> {date} at {formatSlot(pickupTime)}</p>}
              </section>
              <section className={c.card}>
                <div className={c.cardTitle}><UserRound className={c.cardTitleIcon}/><div><h2>2. Contact information</h2><p>Contact details are saved only on this device during testing.</p></div></div>
                <div className={c.threeCol}>
                  <div className={c.field}><label htmlFor="demo-fullname">Full name *</label><input id="demo-fullname" value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={90} placeholder="Your full name" required/></div>
                  <div className={c.field}><label htmlFor="demo-phone">Mobile number *</label><input id="demo-phone" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="0917 123 4567" required/></div>
                  <div className={c.field}><label htmlFor="demo-email">Email (optional)</label><input id="demo-email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} autoComplete="email" type="email" placeholder="name@example.com"/></div>
                </div>
                <div className={c.field}><label htmlFor="demo-note">Pickup note (optional)</label><textarea id="demo-note" value={note} onChange={e => setNote(e.target.value)} maxLength={400} placeholder="Example: Place the order on the pickup shelf, please."/></div>
              </section>
              <section className={c.card}>
                <div className={c.cardTitle}><CreditCard className={c.cardTitleIcon}/><div><h2>3. Payment method</h2><p>Payment options are shown to match the GUI reference.</p></div></div>
                <div className={c.paymentGrid}>
                  {methods.map(method => <button type="button" key={method.id} aria-pressed={payment === method.id} onClick={() => {setPayment(method.id);setError("");}} className={`${c.paymentOption} ${payment === method.id ? c.selected : ""} ${method.id !== "counter" ? c.disabledPayment : ""}`}><strong>{method.id === payment ? "◉ " : "○ "}{method.title}</strong><small>{method.description}</small></button>)}
                </div>
                <div className={c.safe}><LockKeyhole size={16}/><span>GCash, Maya, and card payments are visual previews only. No card or wallet details are collected. Select <strong>Pay at counter</strong> to save a local test order.</span></div>
              </section>
            </div>
            <aside className={c.checkoutSide} aria-label="Order summary and checkout information">
              <section className={`${c.card} ${c.summary} ${c.checkoutSummary}`}>
                <div className={c.cardTitle}><ShoppingBag className={c.cardTitleIcon}/><div><h2>Order summary</h2><p>{shop.name} · {count} item{count === 1 ? "" : "s"}</p></div></div>
                {lines.map(p => <div className={c.summaryItem} key={p.id}><Image src={p.image} alt="" width={44} height={44}/><div><b>{p.name}</b><small>Quantity: {p.quantity}</small></div><strong>{peso(p.quantity * p.price)}</strong></div>)}
                <div className={c.rule}/>
                <div className={c.summaryLine}><span>Subtotal</span><strong>{peso(subtotal)}</strong></div>
                <div className={c.summaryLine}><span>Service fee</span><strong>{peso(SAMPLE_SERVICE_FEE)}</strong></div>
                <div className={c.summaryTotal}><span>Total</span><strong>{peso(total)}</strong></div>
                {error && <p className={c.error} role="alert">{error}</p>}
                <button type="submit" disabled={submitting} className={c.primaryButton}>{submitting ? "Saving order…" : "Confirm Order"}</button>
                
                <p className={c.muted}>Please do not use real private contact details while testing with shared devices.</p>
              </section>
              <div className={`${c.benefits} ${c.checkoutBenefits}`}>
                <div className={c.benefit}><Gift size={20}/><h3>Skip the line</h3><p>Plan pickup before you visit.</p></div>
                <div className={c.benefit}><Leaf size={20}/><h3>Always fresh</h3><p>Order closer to pickup.</p></div>
                <div className={c.benefit}><ShieldCheck size={20}/><h3>Safe checkout</h3><p>Payment integration comes later.</p></div>
              </div>
            </aside>
          </div>
        </form>}
    </main>
  </div>;
}
