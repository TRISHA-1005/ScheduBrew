"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bell, CalendarClock, ChevronRight, ClipboardList, Gift, Heart, MapPin, Pencil, Save, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { peso, shops } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { readOrders, type DemoOrder } from "./demo-order-data";
import { formattedOrderDate, progressFor, trackingSteps } from "./demo-tracking-data";
import { FAVORITES_CHANGED, PROFILE_CHANGED, availableLocations, availableWindows, demoRewardsSummary, displayNameFor, initialPreferences, initialsFor, pickupWindowLabel, readFavorites, readPreferences, savePreferences, toggleFavorite, type DemoPreferences } from "./demo-profile-data";
import s from "./customer.module.css";
import p from "./profile-rewards.module.css";

export function CustomerProfile({ email }: { email: string }) {
  const [loaded, setLoaded] = useState(false);
  const [preferences, setPreferences] = useState<DemoPreferences>(initialPreferences);
  const [draft, setDraft] = useState<DemoPreferences>(initialPreferences);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    function load() {
      const stored = readPreferences(email);
      setPreferences(stored);
      setDraft(stored);
      setFavorites(readFavorites(email));
      setOrders(readOrders());
      setRefresh(x => x + 1);
      setLoaded(true);
    }
    load();
    window.addEventListener("storage", load);
    window.addEventListener(FAVORITES_CHANGED, load);
    window.addEventListener(PROFILE_CHANGED, load);
    window.addEventListener("schedu-demo-orders-updated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(FAVORITES_CHANGED, load);
      window.removeEventListener(PROFILE_CHANGED, load);
      window.removeEventListener("schedu-demo-orders-updated", load);
    };
  }, [email]);

  const name = displayNameFor(email, preferences);
  const favoriteShops = useMemo(() => favorites.flatMap(id => {
    const shop = shops.find(s => s.id === id);
    return shop ? [shop] : [];
  }), [favorites]);
  const rewards = useMemo(() => loaded ? demoRewardsSummary() : { points: 0, completed: 0, history: [] as DemoOrder[] }, [loaded, refresh]);
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const thisMonth = orders.filter(order => {
    const date = new Date(order.createdAt);
    return !Number.isNaN(date.getTime()) && date.getMonth() === month && date.getFullYear() === year;
  }).length;
  const nextRewardPoints = 50;
  const percent = Math.min(100, Math.round(rewards.points / nextRewardPoints * 100));

  function save() {
    if (draft.displayName.trim().length > 70) return setFeedback("Display name must be 70 characters or fewer.");
    const cleaned = { ...draft, displayName: draft.displayName.trim() };
    if (!savePreferences(email, cleaned)) return setFeedback("Unable to save. Check browser storage permissions.");
    setPreferences(cleaned);
    setEditing(false);
    setFeedback("Your profile preferences have been saved.");
  }

  function onFavorite(shopId: string) {
    const next = toggleFavorite(email, shopId);
    if (!next) return setFeedback("Unable to change favorites. Please check browser storage settings.");
    setFavorites(next);
    setFeedback("Favorites updated successfully.");
  }

  return <div className={s.page}>
    <CustomerNav email={email} />
    <main className={s.container}>
      
      <div className={p.heading}>
        <div><div className={p.crumb}><Link href="/customer">Discover</Link><ChevronRight size={13}/> Profile</div><p className={p.eyebrow}>CUSTOMER ACCOUNT</p><h1>Good to see you, {loaded ? name.split(" ")[0] : "Customer"}!</h1><p>Manage your pickup preferences, favorites, rewards, and order history.</p></div>
        <button className={p.outlineButton} type="button" onClick={() => { setEditing(!editing); setDraft(preferences); setFeedback(""); }}><Pencil size={16}/>{editing ? "Cancel editing" : "Edit profile"}</button>
      </div>
      {feedback && <div className={p.feedback} role="status">{feedback}</div>}
      <div className={p.overview}>
        <div className={p.sideColumn}>
          <section className={p.identityCard}>
            <div className={p.identityTop}><span className={p.avatar}>{initialsFor(name)}</span><div><strong>{name}</strong><small>{email}</small></div></div>
            <div className={p.identityDivider}/>
            <div className={p.pointsCount}>{rewards.points}<small>AVAILABLE POINTS</small></div>
            <div className={p.pointsBar}><span style={{ width: `${percent}%` }} /></div>
            <p>{Math.max(0, nextRewardPoints - rewards.points)} points until your next reward</p>
            <Link className={p.identityLink} href="/customer/rewards">View Rewards <ArrowRight size={14}/></Link>
          </section>
          <section className={p.card}>
            <div className={p.cardTitle}><h2><CalendarClock size={18}/> Pickup preferences</h2></div>
            <div className={p.preferenceForm}>
              <label>Preferred location
                {editing ? <select value={draft.preferredLocation} onChange={e => setDraft({ ...draft, preferredLocation: e.target.value })}>{availableLocations.map(loc => <option key={loc}>{loc}</option>)}</select> : <div className={p.preferenceValue}><MapPin size={15}/>{preferences.preferredLocation}</div>}
              </label>
              <label>Favorite pickup window
                {editing ? <select value={draft.pickupWindow} onChange={e => setDraft({ ...draft, pickupWindow: e.target.value })}>{availableWindows.map(w => <option key={w} value={w}>{pickupWindowLabel(w)}</option>)}</select> : <div className={p.preferenceValue}><CalendarClock size={15}/>{pickupWindowLabel(preferences.pickupWindow)}</div>}
              </label>
              {editing && <label>Display name
                <input maxLength={70} placeholder="Your display name" value={draft.displayName} onChange={e => setDraft({ ...draft, displayName: e.target.value })}/>
              </label>}
              <div className={p.notificationTitle}><Bell size={15}/> Notification preferences</div>
              <label className={p.checkLine}><input disabled={!editing} type="checkbox" checked={editing ? draft.readyAlerts : preferences.readyAlerts} onChange={e => setDraft({ ...draft, readyAlerts: e.target.checked })}/> Order ready alerts (preference only)</label>
              <label className={p.checkLine}><input disabled={!editing} type="checkbox" checked={editing ? draft.promoAlerts : preferences.promoAlerts} onChange={e => setDraft({ ...draft, promoAlerts: e.target.checked })}/> Promotions (preference only)</label>
              {editing && <div className={p.editActions}><button type="button" className={p.solidButton} onClick={save}><Save size={15}/> Save changes</button><button type="button" className={p.outlineButton} onClick={() => { setEditing(false); setDraft(preferences); }}><X size={15}/> Cancel</button></div>}
            </div>
            
          </section>
        </div>
        <div className={p.mainColumn}>
          <div className={p.stats}>
            <div className={p.statCard}><small>Orders This Month</small><strong>{thisMonth}</strong><span><ShoppingBag size={14}/> Order history</span></div>
            <div className={p.statCard}><small>Completed Orders</small><strong>{rewards.completed}</strong><span><ClipboardList size={14}/> Completed pickups</span></div>
            <div className={p.statCard}><small>Favorite Shops</small><strong>{favorites.length}</strong><span><Heart size={14}/> Saved shops</span></div>
          </div>
          <section className={p.card}>
            <div className={p.cardTitle}><h2><ShoppingBag size={18}/> Recent orders</h2><Link href="/customer/orders">View all <ArrowRight size={14}/></Link></div>
            {!loaded ? <p className={p.muted}>Loading order history…</p> : orders.length === 0 ? <div className={p.emptyState}><ShoppingBag size={25}/><strong>No Orders Yet</strong><span>Find a shop and start your first order.</span><Link href="/customer">Browse shops <ArrowRight size={14}/></Link></div> : <div className={p.tableWrap}><table className={p.ordersTable}><thead><tr><th>REFERENCE</th><th>SHOP</th><th>PLACED</th><th>TOTAL</th><th>STATUS</th><th> </th></tr></thead><tbody>{orders.slice(0, 5).map(order => <tr key={order.id}><td>{order.id}</td><td>{shops.find(shop => shop.id === order.shopId)?.name || "Shop unavailable"}</td><td>{formattedOrderDate(order.createdAt)}</td><td>{peso(order.total)}</td><td><span className={p.statusChip}>{trackingSteps[progressFor(order).step].label}</span></td><td><Link href={`/customer/orders/${encodeURIComponent(order.id)}`}>Track</Link></td></tr>)}</tbody></table></div>}
          </section>
          <div className={p.twoCards}>
            <section className={p.card}>
              <div className={p.cardTitle}><h2><Heart size={18}/> Favorite shops</h2><Link href="/customer">Discover more <ArrowRight size={14}/></Link></div>
              {!loaded ? <p className={p.muted}>Loading saved shops…</p> : favoriteShops.length === 0 ? <div className={p.emptyState}><Heart size={25}/><strong>No favorites yet</strong><span>Tap the heart on a Discover shop card to save it.</span></div> : <div className={p.favoriteList}>{favoriteShops.map(shop => <div className={p.favoriteRow} key={shop.id}><Link href={`/customer/shops/${shop.id}`}><Image src={shop.image} alt={shop.name} width={58} height={56}/></Link><div><Link href={`/customer/shops/${shop.id}`}>{shop.name}</Link><small>{shop.types} · ★ {shop.rating.toFixed(1)}</small></div><button aria-label={`Remove ${shop.name} from favorites`} title="Remove favorite" type="button" onClick={() => onFavorite(shop.id)}><Heart size={17} fill="currentColor"/></button></div>)}</div>}
            </section>
            <section className={p.card}>
              <div className={p.cardTitle}><h2><Gift size={18}/> Rewards</h2><Link href="/customer/rewards">Explore <ArrowRight size={14}/></Link></div>
              <p className={p.eyebrow}>NEXT REWARD</p><h3 className={p.rewardTitle}>Free size upgrade</h3><p className={p.muted}>A size upgrade unlocks at 50 points.</p>
              <div className={p.progressBar}><span style={{width:`${percent}%`}}/></div>
              <p className={p.progressText}>{rewards.points} / {nextRewardPoints} points</p>
              <div className={p.rewardNote}><ShieldCheck size={16}/> Points are calculated from completed orders.</div>
            </section>
          </div>
        </div>
      </div>
      
    </main>
  </div>;
}
