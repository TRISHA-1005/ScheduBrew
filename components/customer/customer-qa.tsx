"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Info, RotateCcw, ShoppingBag, Smartphone, ShieldAlert } from "lucide-react";
import { CustomerNav } from "./customer-nav";
import { cartDetail, readCart, readOrders } from "./demo-order-data";
import { demoRewardsSummary, readFavorites } from "./demo-profile-data";
import { progressFor } from "./demo-tracking-data";
import s from "./customer.module.css";
import q from "./qa.module.css";

const CHECKS = [
  { name: "Login and logout", detail: "Sign in with your existing Supabase test account, then test sign out and sign in again.", href: "/", link: "Login" },
  { name: "Discover shops", detail: "Search, filter, and save a favorite shop; reload and check that the heart remains selected.", href: "/customer", link: "Discover" },
  { name: "Shop menu", detail: "Open a sample shop, choose a product, and change its quantity.", href: "/customer/shops/brewed-awakenings", link: "Shop Menu" },
  { name: "Shopping cart", detail: "Check product totals and remove items. A cart should only contain items from one shop.", href: "/customer/cart", link: "Cart" },
  { name: "Checkout and pickup", detail: "Choose a sample future slot and Pay at Counter; check form validation and the desktop scroll layout.", href: "/customer/checkout", link: "Checkout" },
  { name: "My Orders", detail: "Confirm the receipt appears after checkout, then try search and status filters.", href: "/customer/orders", link: "My Orders" },
  { name: "Order tracking and QR", detail: "Check Confirmed, Preparing, Ready, Picked Up, and Reset. Verify pickup verification status.", href: "/customer/orders", link: "Orders" },
  { name: "Profile and favorites", detail: "Edit sample preferences and confirm favorites appear in both Discover and Profile.", href: "/customer/profile", link: "Profile" },
  { name: "Rewards", detail: "Complete an order, then check points in Rewards.", href: "/customer/rewards", link: "Rewards" },
  { name: "Responsive and keyboard", detail: "Try 390px, 768px, and 1440px widths; tab through links and buttons, open the mobile menu, and press Escape to close it.", href: "/customer", link: "Test layout" },
];
const QA_STORAGE = "schedu_demo_customer_qa_batch6";

type PreviewCounts = { cart: number; orders: number; ready: number; favorites: number; points: number };
const emptyCounts: PreviewCounts = { cart: 0, orders: 0, ready: 0, favorites: 0, points: 0 };

export function CustomerQa({ email }: { email: string }) {
  const [checked, setChecked] = useState<number[]>([]);
  const [counts, setCounts] = useState<PreviewCounts>(emptyCounts);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(QA_STORAGE) || "[]") as unknown;
      if (Array.isArray(saved)) setChecked(saved.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < CHECKS.length));
    } catch { /* Session storage may be disabled. */ }

    const refresh = () => {
      const orders = readOrders();
      setCounts({
        cart: cartDetail(readCart()).count,
        orders: orders.length,
        ready: orders.filter(order => progressFor(order).step >= 2).length,
        favorites: readFavorites(email).length,
        points: demoRewardsSummary().points,
      });
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("schedu-demo-cart-changed", refresh);
    window.addEventListener("schedu-demo-orders-updated", refresh);
    window.addEventListener("schedu-demo-favorites-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("schedu-demo-cart-changed", refresh);
      window.removeEventListener("schedu-demo-orders-updated", refresh);
      window.removeEventListener("schedu-demo-favorites-changed", refresh);
    };
  }, [email]);

  function toggle(index: number) {
    const updated = checked.includes(index) ? checked.filter(i => i !== index) : [...checked, index];
    setChecked(updated);
    try { window.sessionStorage.setItem(QA_STORAGE, JSON.stringify(updated)); } catch { /* no-op */ }
  }

  function resetChecklist() {
    setChecked([]);
    try { window.sessionStorage.removeItem(QA_STORAGE); } catch { /* no-op */ }
  }

  return <div className={s.page}>
    <CustomerNav email={email} />
    <main className={s.container}>
      
      <div className={q.heading}><div><span className={q.eyebrow}>CUSTOMER BATCH 6</span><h1>Frontend integration and testing</h1><p>Check every customer module before starting the Business Owner Panel.</p></div><span className={q.score}>{checked.length} / {CHECKS.length} reviewed</span></div>
      <div className={q.progress} role="progressbar" aria-label="Manual checks completed" aria-valuenow={checked.length} aria-valuemin={0} aria-valuemax={CHECKS.length}><span style={{ width: `${checked.length / CHECKS.length * 100}%` }}/></div>
      <div className={q.dataPanel}>
        <div className={q.panelTitle}><ClipboardCheck size={18}/><strong>Current browser data</strong><button type="button" onClick={() => window.location.reload()}><RotateCcw size={14}/> Refresh</button></div>
        <div className={q.stats}>
          <div><span>Cart items</span><b>{counts.cart}</b></div>
          <div><span>Demo orders</span><b>{counts.orders}</b></div>
          <div><span>Ready or completed</span><b>{counts.ready}</b></div>
          <div><span>Favorite shops</span><b>{counts.favorites}</b></div>
          <div><span>Demo reward points</span><b>{counts.points}</b></div>
        </div>
        <p><Info size={15}/> These counts come from your browser. They do not confirm a real database connection or merchant activity.</p>
      </div>
      <section className={q.list} aria-label="Customer frontend manual testing steps">
        {CHECKS.map((check, i) => <div className={q.checkRow} key={check.name}>
          <label className={q.checkboxLabel}>
            <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)}/>
            <span className={q.checkName}>{check.name}<small>{check.detail}</small></span>
          </label>
          <Link href={check.href} className={q.testLink}>{check.link}<ArrowRight size={14}/></Link>
        </div>)}
      </section>
      <div className={q.notes}>
        <div><Smartphone size={19}/><strong>Responsive test</strong><p>In Microsoft Edge press F12, then use the device toolbar or resize your window. Look for clipped cards, horizontal page overflow, overlapping text, and a usable mobile menu.</p></div>
        <div><ShieldAlert size={19}/><strong>Important demo limitation</strong><p>Sample cart and orders are browser storage, and older batches do not securely separate them by customer account. Use fake contact details only. Real payments, slots, QR verification, authorization, and database access still require backend work.</p></div>
      </div>
      <div className={q.footerActions}>
        <button type="button" onClick={resetChecklist}><RotateCcw size={16}/> Reset checklist</button>
        <Link href="/customer"><ShoppingBag size={16}/> Return to Discover</Link>
      </div>
      {checked.length === CHECKS.length && <p className={q.complete} role="status"><CheckCircle2 size={18}/> All manual checks are marked complete. Review any browser console errors and unresolved issues before starting business owner modules.</p>}
    </main>
  </div>;
}
