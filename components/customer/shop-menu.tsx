"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, Minus, Plus, ShoppingBag, Star, Trash2 } from "lucide-react";
import { categories, products, peso, type CategoryId, type Product, type Shop } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import s from "./customer.module.css";

type Line = { productId: string; quantity: number };
const STORAGE_KEY='schedu_demo_cart_v1';

export function ShopMenu({ shop, email }: {shop:Shop;email:string}) {
  const router=useRouter();
  const menu=useMemo(()=>products.filter(p=>p.shopId===shop.id),[shop.id]);
  const [category,setCategory]=useState<CategoryId>('all');
  const [lines,setLines]=useState<Line[]>([]);
  const [pickupDay,setPickupDay]=useState('today');
  const [pickupTime,setPickupTime]=useState('15:20');
  const [message,setMessage]=useState('');
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    try {
      const data=JSON.parse(window.localStorage.getItem(STORAGE_KEY)||'null') as {shopId?:string;lines?:Line[]} | null;
      if(data?.shopId===shop.id && Array.isArray(data.lines)) {
        // Only restore valid quantities and items belonging to this shop.
        setLines(data.lines.filter(x=>menu.some(p=>p.id===x.productId)&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=30));
      }
    } catch { /* Do not crash the interface because of stale browser storage. */ }
    setLoaded(true);
  },[shop.id,menu]);
  useEffect(()=>{
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY,JSON.stringify({shopId:shop.id,lines}));
  },[lines,loaded,shop.id]);
  const filtered=category==='all'?menu:menu.filter(p=>p.category===category);
  const displayedCategories=categories.filter(cat=>cat.id==='all'||menu.some(p=>p.category===cat.id));
  const chosen=lines.flatMap(line=>{const p=menu.find(x=>x.id===line.productId);return p?[{...p,quantity:line.quantity}]:[]});
  const quantity=chosen.reduce((n,p)=>n+p.quantity,0);
  const total=chosen.reduce((n,p)=>n+p.price*p.quantity,0);
  function updateQuantity(productId:string,delta:number){
    setLines(current=>{
      const previous=current.find(x=>x.productId===productId)?.quantity||0;
      const nextQty=Math.max(0,Math.min(30,previous+delta));
      const next=current.filter(x=>x.productId!==productId);
      if(nextQty>0) next.push({productId,quantity:nextQty});
      // This is only a browser demo cart. It does not create a database order.
      return next;
    });
    setMessage('');
  }
  function clearCart(){setLines([]);setMessage('Your cart has been cleared.');}
  return <div className={s.page}>
    <CustomerNav email={email}/>
    <main className={s.container}>
      
      <Link href="/customer#browse" className={s.backLink}><ArrowLeft size={15}/> Back to Discover</Link>
      <div className={s.menuLayout}>
        <div className={s.menuContent}>
          <section className={s.shopHero}>
            <Image src={shop.image} alt="" fill priority sizes="(max-width: 1024px) 95vw, 65vw" className={s.shopHeroImage}/>
            <div className={s.shopHeroText}>
              <span>{shop.types.toUpperCase()} · {shop.location.toUpperCase()}</span>
              <h1>{shop.name}</h1>
              <div className={s.heroInfo}><span><Star size={15} fill="currentColor"/> {shop.rating.toFixed(1)} ({shop.reviewCount})</span><span><Clock3 size={15}/> Estimated prep: {shop.prepMinutes} min</span></div>
            </div>
          </section>
          <div className={s.menuIntro}><h2>Explore our menu</h2><p>Choose your favorites and add them to your cart.</p></div>
          <div className={s.categoryChips}>{displayedCategories.map(cat=><button type="button" key={cat.id} className={`${s.categoryChip} ${category===cat.id?s.selectedChip:''}`} onClick={()=>setCategory(cat.id)} aria-pressed={category===cat.id}><span>{cat.icon}</span>{cat.label}</button>)}</div>
          <div className={s.menuProducts}>{filtered.map(product=>{
            const count=lines.find(x=>x.productId===product.id)?.quantity||0;
            return <article className={s.menuProductCard} key={product.id}>
              <div className={s.menuProductImage}><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 45vw, (max-width: 1100px) 28vw, 17vw"/></div>
              <div className={s.menuProductDetails}><h3>{product.name}</h3><p>{product.description}</p><div className={s.productRating}><Star size={12} fill="currentColor"/>{product.rating.toFixed(1)}</div><div className={s.productBottom}><b>{peso(product.price)}</b><button type="button" onClick={()=>updateQuantity(product.id,1)} aria-label={`Add ${product.name} to cart`}>{count>0?<><Plus size={13}/> Add more ({count})</>:<><Plus size={13}/> Add</>}</button></div></div>
            </article>
          })}</div>
          {filtered.length===0 && <p className={s.empty}>No items are available in this category.</p>}
          <div className={s.infoStrip}><CheckCircle2 size={17}/> One shop per order. Pickup time availability will be confirmed when live booking is enabled.</div>
        </div>
        <aside className={s.cartPanel} aria-label="Shopping cart">
          <div className={s.cartTitle}><h2>Your order</h2><span>{quantity} item{quantity!==1?'s':''}</span></div>
          {!loaded ? <p className={s.emptyCart}>Loading your cart...</p>:chosen.length===0?<div className={s.emptyCart}><ShoppingBag size={32}/><p>Your cart is empty.</p><span>Choose an item from the menu to start.</span></div>:<div className={s.cartItems}>{chosen.map(product=><div className={s.cartLine} key={product.id}>
            <Image src={product.image} alt="" width={55} height={55}/><div className={s.lineDetails}><b>{product.name}</b><strong>{peso(product.price*product.quantity)}</strong><div className={s.quantityButtons}><button type="button" aria-label={`Remove one ${product.name}`} onClick={()=>updateQuantity(product.id,-1)}><Minus size={14}/></button><span>{product.quantity}</span><button type="button" aria-label={`Add one ${product.name}`} onClick={()=>updateQuantity(product.id,1)}><Plus size={14}/></button></div></div>
          </div>)}</div>}
          <div className={s.pickupBox}><h3>Pickup schedule</h3><label htmlFor="pickupDay">Pickup day</label><select id="pickupDay" value={pickupDay} onChange={e=>setPickupDay(e.target.value)}><option value="today">Today</option><option value="tomorrow">Tomorrow</option></select><label htmlFor="pickupTime">Preferred window</label><select id="pickupTime" value={pickupTime} onChange={e=>setPickupTime(e.target.value)}><option value="15:20">3:20 PM to 3:35 PM</option><option value="15:40">3:40 PM to 3:55 PM</option><option value="16:00">4:00 PM to 4:15 PM</option></select><small>These windows are examples only. No live booking is created.</small></div>
          <div className={s.cartSummary}><span>Subtotal</span><strong>{peso(total)}</strong></div>
          <button type="button" className={s.checkoutButton} disabled={quantity===0} onClick={()=>router.push("/customer/checkout")}>Continue to checkout</button>
          {quantity>0 && <Link href="/customer/cart" className={s.backLink} style={{justifyContent:"center",marginTop:12}}>View full cart</Link>}
          {message && <p className={s.cartMessage} role="status">{message}</p>}
          {quantity>0 && <button type="button" onClick={clearCart} className={s.clearButton}><Trash2 size={14}/> Clear cart</button>}
          <p className={s.cartFinePrint}>Test mode: Pickup times are examples, not live shop availability.</p>
        </aside>
      </div>
    </main>
  </div>;
}
