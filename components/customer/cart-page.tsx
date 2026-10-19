"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { peso } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { cartDetail, changeCartQuantity, emptyCart, readCart, saveCart, type DemoCart } from "./demo-order-data";
import s from "./customer.module.css";
import c from "./cart-checkout.module.css";

export function CartPage({ email }: { email: string }) {
  const [cart, setCart] = useState<DemoCart>(emptyCart());
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setCart(readCart()); setLoaded(true); }, []);
  const { shop, lines, subtotal, count } = cartDetail(cart);

  function update(id: string, delta: number) {
    const next = changeCartQuantity(cart, id, delta);
    setCart(next);
    saveCart(next);
  }
  function clear() { const next=emptyCart(); setCart(next); saveCart(next); }
  return <div className={s.page}>
    <CustomerNav email={email}/>
    <main className={s.container}>
      
      <Link className={s.backLink} href={shop ? `/customer/shops/${shop.id}` : "/customer"}><ArrowLeft size={15}/> {shop ? `Back to ${shop.name}` : "Back to Discover"}</Link>
      <div className={c.heading}><p className={c.kicker}>YOUR CART</p><h1>Review your order</h1><p>Adjust your favorites before choosing a pickup time.</p></div>
      {!loaded ? <section className={c.emptyCard}>Loading your cart…</section> : !count || !shop ? <section className={c.emptyCard}><ShoppingBag size={38}/><h2>Your cart is empty</h2><p>Browse shops and add your favorite drinks or snacks.</p><Link className={c.primaryButton} href="/customer#browse">Discover shops</Link></section> :
      <div className={c.layout}>
        <section className={c.card}>
          <div className={c.cardTitle}><ShoppingBag className={c.cardTitleIcon}/><div><h2>{shop.name}</h2><p>{count} item{count === 1 ? "" : "s"} in your cart. One shop per order.</p></div></div>
          {lines.map(p => <div className={c.productRow} key={p.id}>
            <Image src={p.image} alt={p.name} className={c.productImage} width={74} height={74}/>
            <div className={c.productText}><h3>{p.name}</h3><small>{p.description}</small><strong>{peso(p.price * p.quantity)}</strong></div>
            <div className={c.stepper}>
              <button type="button" onClick={() => update(p.id, -1)} aria-label={`Decrease ${p.name}`}><Minus size={15}/></button>
              <span>{p.quantity}</span>
              <button type="button" onClick={() => update(p.id, 1)} aria-label={`Increase ${p.name}`}><Plus size={15}/></button>
            </div>
          </div>)}
          <div className={c.inlineActions} style={{marginTop:18}}><Link className={c.secondaryButton} href={`/customer/shops/${shop.id}`}><Plus size={15}/> Add more items</Link><button type="button" onClick={clear}><Trash2 size={13} style={{display:"inline",verticalAlign:"middle"}}/> Clear cart</button></div>
        </section>
        <aside className={`${c.card} ${c.summary}`}>
          <div className={c.cardTitle}><ShoppingBag className={c.cardTitleIcon}/><div><h2>Order summary</h2><p>{shop.name}</p></div></div>
          <div className={c.summaryLine}><span>Items</span><strong>{count}</strong></div>
          <div className={c.summaryLine}><span>Subtotal</span><strong>{peso(subtotal)}</strong></div>
          <div className={c.rule}/>
          <div className={c.summaryTotal}><span>Subtotal</span><strong>{peso(subtotal)}</strong></div>
          <Link href="/customer/checkout" className={c.primaryButton}>Continue to checkout →</Link>
          <p className={c.muted}>Your cart is saved on this device. Pickup details are reviewed at checkout.</p>
        </aside>
      </div>}
    </main>
  </div>;
}
