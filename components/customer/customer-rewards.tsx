"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, CheckCircle2, ChevronRight, Coffee, Gift, LockKeyhole, ShoppingBag, Sparkles, Star, Ticket, TrendingUp } from "lucide-react";
import { peso, shops } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { formattedOrderDate } from "./demo-tracking-data";
import { demoRewardsSummary } from "./demo-profile-data";
import s from "./customer.module.css";
import p from "./profile-rewards.module.css";

type Tab = "all" | "unlocked" | "history";
const previewRewards = [
  { id: "size", title: "Free size upgrade", points: 50, description: "An illustrative drink size upgrade at a participating cafe.", icon: "coffee" },
  { id: "voucher", title: "₱30 sample voucher", points: 120, description: "A fictional discount preview for a future rewards program.", icon: "ticket" },
  { id: "treat", title: "Complimentary pastry", points: 200, description: "A demonstration reward for your next cafe visit.", icon: "gift" },
] as const;

export function CustomerRewards({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("all");
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => { setLoaded(true); setVersion(x => x + 1); };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("schedu-demo-orders-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("schedu-demo-orders-updated", refresh);
    };
  }, []);

  const rewards = useMemo(() => loaded ? demoRewardsSummary() : { points: 0, completed: 0, history: [] as ReturnType<typeof demoRewardsSummary>["history"] }, [loaded, version]);
  const upcoming = previewRewards.find(r => r.points > rewards.points);
  const nextGoal = upcoming?.points || previewRewards[previewRewards.length - 1].points;
  const currentPercent = Math.min(100, Math.round(rewards.points / nextGoal * 100));
  const visibleRewards = previewRewards.filter(item => tab !== "unlocked" || rewards.points >= item.points);
  const selectedReward = previewRewards.find(r => r.id === selected);

  return <div className={s.page}>
    <CustomerNav email={email}/>
    <main className={s.container}>
      <div className={s.demoNotice}>FRONTEND PREVIEW <span>All loyalty points, perks, and transactions here are demonstrations. Nothing can be redeemed or transferred to a merchant.</span></div>
      <div className={p.heading}>
        <div><div className={p.crumb}><Link href="/customer">Discover</Link><ChevronRight size={13}/> Rewards</div><p className={p.eyebrow}>SCHEDUBREW LOYALTY</p><h1>Rewards that make every sip sweeter</h1><p>Explore how future customer rewards could work with completed demo orders.</p></div>
        <Link className={p.outlineButton} href="/customer/profile"><Award size={16}/> My Profile</Link>
      </div>
      <div className={p.rewardHero}>
        <div className={p.rewardHeroCopy}>
          <span className={p.orangeKicker}><Sparkles size={15}/> SAMPLE REWARDS CLUB</span>
          <h2>{rewards.points} <span>demo points</span></h2>
          <p>Earn 1 example point for every ₱25 of subtotal from a completed demo order. This is a frontend illustration, not an official ScheduBrew rewards policy.</p>
          <div className={p.darkProgress}><span style={{width:`${currentPercent}%`}}/></div>
          <small>{upcoming ? `${Math.max(0, nextGoal - rewards.points)} more demo points to preview ${upcoming.title}` : "All example reward tiers reached"}</small>
        </div>
        <div className={p.rewardHeroIcon}><Gift size={78} strokeWidth={1.25}/><div className={p.starOne}><Star size={24} fill="currentColor"/></div><div className={p.starTwo}><Star size={16} fill="currentColor"/></div></div>
      </div>
      <div className={p.rewardStats}>
        <div className={p.rewardStat}><Award size={21}/><div><b>{rewards.points}</b><span>Available demo points</span></div></div>
        <div className={p.rewardStat}><ShoppingBag size={21}/><div><b>{rewards.completed}</b><span>Completed demo orders</span></div></div>
        <div className={p.rewardStat}><TrendingUp size={21}/><div><b>{previewRewards.filter(r=>rewards.points>=r.points).length}</b><span>Example tiers unlocked</span></div></div>
      </div>
      <div className={p.rewardToolbar}>
        <div><p className={p.eyebrow}>LOYALTY PREVIEW</p><h2>Explore sample rewards</h2></div>
        <div className={p.rewardTabs} role="group" aria-label="Reward filters">
          <button type="button" aria-pressed={tab==="all"} className={tab==="all"?p.tabActive:""} onClick={()=>setTab("all")}>All rewards</button>
          <button type="button" aria-pressed={tab==="unlocked"} className={tab==="unlocked"?p.tabActive:""} onClick={()=>setTab("unlocked")}>Unlocked</button>
          <button type="button" aria-pressed={tab==="history"} className={tab==="history"?p.tabActive:""} onClick={()=>setTab("history")}>Points history</button>
        </div>
      </div>
      {tab === "history" ? <section className={p.card}>
        <div className={p.cardTitle}><h2>Demo points activity</h2><span className={p.muted}>Only completed example orders earn points</span></div>
        {rewards.history.length === 0 ? <div className={p.emptyState}><Coffee size={30}/><strong>No points earned yet</strong><span>Complete a sample order through Batch 4 tracking to show activity here.</span><Link href="/customer/orders">View demo orders <ArrowRight size={14}/></Link></div> : <div className={p.activityList}>{rewards.history.map(order => {
          const earned = Math.floor(Math.max(0, order.subtotal) / 25);
          return <div key={order.id} className={p.activityRow}><div className={p.activityIcon}><CheckCircle2 size={18}/></div><div><b>Completed demo order · {shops.find(s=>s.id===order.shopId)?.name||"Sample shop"}</b><small>{order.id} · Placed {formattedOrderDate(order.createdAt)}</small><small>Subtotal: {peso(order.subtotal)} (illustrative)</small></div><strong>+{earned} pts</strong></div>;
        })}</div>}
      </section> : <>
        {visibleRewards.length === 0 ? <div className={p.emptyState}><LockKeyhole size={27}/><strong>No sample rewards unlocked yet</strong><span>Complete more demo orders to preview future reward tiers.</span><button type="button" onClick={()=>setTab("all")}>View all reward previews</button></div> : <div className={p.rewardCards}>
          {visibleRewards.map(reward => {
            const unlocked = rewards.points >= reward.points;
            return <article key={reward.id} className={p.rewardCard}>
              <div className={p.rewardCardHead}><div className={p.rewardPicture}>{reward.icon==="coffee"?<Coffee size={31}/>:reward.icon==="ticket"?<Ticket size={31}/>:<Gift size={31}/>}</div><span className={unlocked?p.unlockedBadge:p.lockedBadge}>{unlocked?<><CheckCircle2 size={13}/> Demo unlocked</>:<><LockKeyhole size={13}/> Locked preview</>}</span></div>
              <h3>{reward.title}</h3><p>{reward.description}</p><div className={p.rewardCardBottom}><b>{reward.points} <span>demo points</span></b><button type="button" onClick={()=>setSelected(reward.id)}>View details <ArrowRight size={14}/></button></div>
            </article>;
          })}
        </div>}
      </>}
      <div className={p.rewardHow}>
        <h2>How this frontend demo works</h2>
        <div><span>1</span><p><b>Place a demo order.</b> Use the sample shops and Pay at Counter checkout.</p></div>
        <div><span>2</span><p><b>Complete its sample tracking.</b> In My Orders, simulate the Picked Up status.</p></div>
        <div><span>3</span><p><b>Preview points.</b> Completed demo orders add fictional loyalty points automatically. Real redemption is not enabled.</p></div>
      </div>
      {selectedReward && <div className={p.modalOverlay} role="presentation" onClick={()=>setSelected(null)}>
        <section className={p.rewardModal} role="dialog" aria-modal="true" aria-labelledby="sample-reward-title" onClick={e=>e.stopPropagation()}>
          <div className={p.modalTop}><div className={p.rewardPicture}><Gift size={27}/></div><button type="button" onClick={()=>setSelected(null)} aria-label="Close reward preview">×</button></div>
          <p className={p.eyebrow}>ILLUSTRATIVE REWARD ONLY</p><h2 id="sample-reward-title">{selectedReward.title}</h2><p>{selectedReward.description}</p>
          <div className={p.modalSummary}><span>Example requirement</span><b>{selectedReward.points} demo points</b></div>
          <div className={p.modalSummary}><span>Your current example balance</span><b>{rewards.points} demo points</b></div>
          <p className={p.muted}>No voucher, discount, or free item is issued. Redemption will require merchant participation, real rewards rules, and database verification.</p>
          <button type="button" className={p.solidButton} onClick={()=>setSelected(null)}>Got it</button>
        </section>
      </div>}
      <p className={p.bottomDisclaimer}><Sparkles size={14}/> Your real Supabase account has no loyalty balance yet. The demo values are calculated locally in this browser.</p>
    </main>
  </div>;
}
