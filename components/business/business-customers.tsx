"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Award, BarChart3, CalendarClock, Check, ChevronDown,
  ClipboardList, Coffee, Download, Eye, Gift, LayoutDashboard,
  Mail, Menu, MoreHorizontal, Plus, RotateCcw, Search, Settings, ShieldCheck,
  Sparkles, TrendingUp, UsersRound, Wallet, X,
} from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import { BusinessShopDetails } from "./business-shop-details";
import { money } from "./demo-business-data";
import {
  formatPoints, readLoyaltyMetrics, readOwnerCustomers, readOwnerRewards,
  STARTER_CUSTOMERS, STARTER_LOYALTY_METRICS, STARTER_REWARDS, tierForPoints,
  writeLoyaltyMetrics, writeOwnerCustomers, writeOwnerRewards,
  type DemoCustomer, type LoyaltyMetrics, type LoyaltyReward, type LoyaltyTier,
} from "./customer-loyalty-data";
import shell from "./dashboard.module.css";
import styles from "./customers.module.css";

type TierFilter = "All tiers" | LoyaltyTier;
type PointsAction = "add" | "deduct";

type RewardForm = { name: string; description: string; pointsRequired: string };
const emptyRewardForm = (): RewardForm => ({ name: "", description: "", pointsRequired: "120" });

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { name: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { name: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { name: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { name: "Customers", icon: UsersRound, href: "/business/customers", batch: 5 },
  { name: "Analytics", icon: BarChart3, href: "/business/analytics", batch: 6 },
  { name: "Settings", icon: Settings, href: "/business/settings", batch: 8 },
] as const;

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "SB";
}

function avatarInitials(email: string): string {
  const part = email.split("@")[0] || "SB";
  return part.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB";
}

function tierClass(tier: LoyaltyTier): string {
  if (tier === "Gold") return styles.tierGold;
  if (tier === "Silver") return styles.tierSilver;
  return styles.tierBronze;
}

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function BusinessCustomers({ email }: { email: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [customers, setCustomers] = useState<DemoCustomer[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [metrics, setMetrics] = useState<LoyaltyMetrics>(STARTER_LOYALTY_METRICS);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("All tiers");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [rewardDialog, setRewardDialog] = useState(false);
  const [rewardForm, setRewardForm] = useState<RewardForm>(emptyRewardForm);
  const [rewardFormError, setRewardFormError] = useState("");
  const [pointsCustomerId, setPointsCustomerId] = useState<string | null>(null);
  const [pointsAction, setPointsAction] = useState<PointsAction>("add");
  const [pointsAmount, setPointsAmount] = useState("50");
  const [pointsReason, setPointsReason] = useState("");
  const [pointsFormError, setPointsFormError] = useState("");
  const rewardNameRef = useRef<HTMLInputElement>(null);
  const pointsAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => {
      setCustomers(readOwnerCustomers());
      setRewards(readOwnerRewards());
      setMetrics(readLoyaltyMetrics());
    };
    refresh();
    setHydrated(true);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenu && !rewardDialog && !pointsCustomerId && !selectedCustomerId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenu(false);
        setRewardDialog(false);
        setPointsCustomerId(null);
        setSelectedCustomerId(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenu, rewardDialog, pointsCustomerId, selectedCustomerId]);

  useEffect(() => {
    if (rewardDialog) rewardNameRef.current?.focus();
  }, [rewardDialog]);

  useEffect(() => {
    if (pointsCustomerId) pointsAmountRef.current?.focus();
  }, [pointsCustomerId]);

  const filteredCustomers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter(customer => {
      const matchesQuery = !term || [customer.name, customer.email, customer.favoriteItem, customer.id]
        .some(value => value.toLowerCase().includes(term));
      const matchesTier = tierFilter === "All tiers" || tierForPoints(customer.points) === tierFilter;
      return matchesQuery && matchesTier;
    }).sort((a, b) => b.spent - a.spent);
  }, [customers, query, tierFilter]);

  const selectedCustomer = selectedCustomerId ? customers.find(customer => customer.id === selectedCustomerId) : undefined;
  const pointsCustomer = pointsCustomerId ? customers.find(customer => customer.id === pointsCustomerId) : undefined;
  const topCustomer = customers.reduce<DemoCustomer | undefined>((best, customer) => !best || customer.spent > best.spent ? customer : best, undefined);
  const activeRewards = rewards.filter(reward => reward.active);
  const tierCounts = useMemo(() => ({
    Gold: customers.filter(customer => tierForPoints(customer.points) === "Gold").length,
    Silver: customers.filter(customer => tierForPoints(customer.points) === "Silver").length,
    Bronze: customers.filter(customer => tierForPoints(customer.points) === "Bronze").length,
  }), [customers]);

  function saveCustomers(next: DemoCustomer[], success: string): boolean {
    if (!writeOwnerCustomers(next)) {
      setNotice("Changes could not be saved in this browser. Check available browser storage and try again.");
      return false;
    }
    setCustomers(next);
    setNotice(success);
    return true;
  }

  function saveRewards(next: LoyaltyReward[], success: string): boolean {
    if (!writeOwnerRewards(next)) {
      setNotice("Rewards could not be saved in this browser. Check available browser storage and try again.");
      return false;
    }
    setRewards(next);
    setNotice(success);
    return true;
  }

  function exportCustomers() {
    const header = ["customer_id", "name", "email", "orders", "spent_php", "points", "tier", "last_visit", "favorite_item"];
    const rows = customers.map(customer => [
      customer.id, customer.name, customer.email, customer.orders, customer.spent,
      customer.points, tierForPoints(customer.points), customer.lastVisit, customer.favoriteItem,
    ].map(csvCell).join(","));
    const blob = new Blob([`\uFEFF${[header.join(","), ...rows].join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "schedubrew-customer-directory.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2500);
    setNotice("Customer directory exported as a CSV file.");
  }

  function openRewardDialog() {
    setRewardForm(emptyRewardForm());
    setRewardFormError("");
    setRewardDialog(true);
  }

  function createReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = rewardForm.name.trim();
    const description = rewardForm.description.trim();
    const pointsRequired = Number(rewardForm.pointsRequired);
    if (name.length < 3 || name.length > 100) {
      setRewardFormError("Enter a reward name between 3 and 100 characters.");
      return;
    }
    if (description.length > 240) {
      setRewardFormError("Keep the description within 240 characters.");
      return;
    }
    if (!Number.isInteger(pointsRequired) || pointsRequired < 1 || pointsRequired > 100000) {
      setRewardFormError("Enter a whole number of points between 1 and 100,000.");
      return;
    }
    if (rewards.some(reward => reward.name.trim().toLowerCase() === name.toLowerCase())) {
      setRewardFormError("A reward with this name already exists.");
      return;
    }
    if (rewards.length >= 100) {
      setRewardFormError("A maximum of 100 rewards is allowed.");
      return;
    }
    const reward: LoyaltyReward = {
      id: `RWD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name, description, pointsRequired, active: true, redemptions: 0,
    };
    if (saveRewards([...rewards, reward], `${name} was added to the local rewards list.`)) {
      setRewardDialog(false);
    }
  }

  function toggleReward(reward: LoyaltyReward) {
    saveRewards(rewards.map(item => item.id === reward.id ? { ...item, active: !item.active } : item),
      `${reward.name} ${reward.active ? "paused" : "activated"}.`);
  }

  function removeReward(reward: LoyaltyReward) {
    if (!window.confirm(`Remove "${reward.name}" from rewards?`)) return;
    saveRewards(rewards.filter(item => item.id !== reward.id), `${reward.name} was removed from the local rewards list.`);
  }

  function openPointsDialog(customer: DemoCustomer) {
    setPointsCustomerId(customer.id);
    setPointsAction("add");
    setPointsAmount("50");
    setPointsReason("");
    setPointsFormError("");
  }

  function adjustPoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pointsCustomer) return;
    const amount = Number(pointsAmount);
    const reason = pointsReason.trim();
    if (!Number.isInteger(amount) || amount < 1 || amount > 5000) {
      setPointsFormError("Enter a whole number between 1 and 5,000 points.");
      return;
    }
    if (reason.length < 3 || reason.length > 120) {
      setPointsFormError("Enter a short reason between 3 and 120 characters.");
      return;
    }
    if (pointsAction === "deduct" && amount > pointsCustomer.points) {
      setPointsFormError("The customer does not have enough points for this adjustment.");
      return;
    }
    const delta = pointsAction === "add" ? amount : -amount;
    const nextCustomers = customers.map(customer => customer.id === pointsCustomer.id
      ? { ...customer, points: customer.points + delta }
      : customer);
    const nextMetrics = {
      ...metrics,
      pointsIssuedThisMonth: metrics.pointsIssuedThisMonth + (pointsAction === "add" ? amount : 0),
    };
    if (!writeOwnerCustomers(nextCustomers)) {
      setPointsFormError("The adjustment could not be saved. Try again.");
      return;
    }
    if (!writeLoyaltyMetrics(nextMetrics)) {
      setPointsFormError("The customer balance was saved, but the summary could not be updated. Please refresh and review it.");
      setCustomers(nextCustomers);
      return;
    }
    setCustomers(nextCustomers);
    setMetrics(nextMetrics);
    setPointsCustomerId(null);
    setNotice(`${formatPoints(amount)} points ${pointsAction === "add" ? "added to" : "deducted from"} ${pointsCustomer.name}. Reason: ${reason}.`);
  }

  function redeemReward(customer: DemoCustomer, reward: LoyaltyReward) {
    if (!reward.active) {
      setNotice("This reward is currently paused.");
      return;
    }
    if (customer.points < reward.pointsRequired) {
      setNotice(`${customer.name} needs ${formatPoints(reward.pointsRequired - customer.points)} more points for ${reward.name}.`);
      return;
    }
    if (!window.confirm(`Redeem "${reward.name}" for ${customer.name} for ${formatPoints(reward.pointsRequired)} points?`)) return;
    const nextCustomers = customers.map(item => item.id === customer.id
      ? { ...item, points: item.points - reward.pointsRequired }
      : item);
    const nextRewards = rewards.map(item => item.id === reward.id
      ? { ...item, redemptions: item.redemptions + 1 }
      : item);
    const nextMetrics = { ...metrics, rewardsRedeemed: metrics.rewardsRedeemed + 1 };
    const customerSaved = writeOwnerCustomers(nextCustomers);
    const rewardSaved = writeOwnerRewards(nextRewards);
    const metricsSaved = writeLoyaltyMetrics(nextMetrics);
    if (!customerSaved || !rewardSaved || !metricsSaved) {
      setNotice("The redemption could not be saved. Refresh the page and try again.");
      return;
    }
    setCustomers(nextCustomers);
    setRewards(nextRewards);
    setMetrics(nextMetrics);
    setNotice(`${reward.name} redeemed for ${customer.name}. ${formatPoints(reward.pointsRequired)} points were deducted.`);
  }

  function resetExamples() {
    if (!window.confirm("Reset customer records, rewards and loyalty totals to their original values? This removes your saved changes.")) return;
    const customersOk = writeOwnerCustomers(STARTER_CUSTOMERS.map(customer => ({ ...customer })));
    const rewardsOk = writeOwnerRewards(STARTER_REWARDS.map(reward => ({ ...reward })));
    const metricsOk = writeLoyaltyMetrics({ ...STARTER_LOYALTY_METRICS });
    if (!customersOk || !rewardsOk || !metricsOk) {
      setNotice("Some data could not be reset. Check browser storage and try again.");
      return;
    }
    setCustomers(STARTER_CUSTOMERS.map(customer => ({ ...customer })));
    setRewards(STARTER_REWARDS.map(reward => ({ ...reward })));
    setMetrics({ ...STARTER_LOYALTY_METRICS });
    setQuery("");
    setTierFilter("All tiers");
    setSelectedCustomerId(null);
    setNotice("Restored customer and loyalty settings.");
  }

  return (
    <div className={`${shell.workspace} ${styles.workspace}`}>
      {mobileMenu && <button type="button" className={shell.mobileScrim} aria-label="Close business navigation" onClick={() => setMobileMenu(false)} />}
      <aside className={`${shell.sidebar} ${mobileMenu ? shell.sidebarOpen : ""}`} aria-label="Business owner navigation">
        <div className={shell.sideBrand}>
          <Link href="/business" className={shell.brandLink} onClick={() => setMobileMenu(false)}>
            <span className={shell.trcBadge}>TR<span>C</span></span>
            <span><strong>Schedu<span>Brew</span></strong><small>OWNER WORKSPACE</small></span>
          </Link>
          <button type="button" className={shell.closeSide} onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className={shell.sideNavigation} aria-label="Business modules">
          {nav.map(({ name, icon: Icon, href, batch }) => (
            <Link key={name} href={href} className={`${shell.sideItem} ${batch === 5 ? shell.sideActive : ""}`} aria-current={batch === 5 ? "page" : undefined} onClick={() => setMobileMenu(false)}>
              <Icon size={18} aria-hidden="true" /><span>{name}</span>
            </Link>
          ))}
        </nav>
        <div className={shell.sideFoot}>
          <div className={shell.sideFootTitle}><ShieldCheck size={17} /> Customer care and loyalty</div>
          <p>Review regular customers, keep reward rules clear, and recognize repeat visits.</p>
        </div>
      </aside>

      <div className={shell.mainArea}>
        <header className={shell.topbar}>
          <div className={shell.topLeft}>
            <button type="button" className={shell.mobileMenu} onClick={() => setMobileMenu(true)} aria-label="Open business navigation"><Menu size={22} /></button>
            <BusinessShopDetails />
          </div>
          <div className={shell.topRight}>
            <span className={shell.datePill}><CalendarClock size={14} />{new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(new Date())}</span>
            <div className={shell.avatar} title={email} aria-label="Signed in user">{avatarInitials(email)}</div>
            <Logout />
          </div>
        </header>

        <main className={styles.content}>
          <div className={styles.headingRow}>
            <div><span className={styles.eyebrow}>CRM &amp; LOYALTY</span><h1>Customers</h1><p>See your regulars, loyalty engagement, and recent activity.</p></div>
            <div className={styles.headerActions}>
              <button type="button" className={styles.secondaryButton} onClick={exportCustomers} disabled={!hydrated}><Download size={16} /> Export list</button>
              <button type="button" className={styles.primaryButton} onClick={openRewardDialog} disabled={!hydrated}><Plus size={17} /> Create reward</button>
            </div>
          </div>

          
          {notice && <div className={styles.notice} role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={16} /></button></div>}

          <div className={styles.dashboardGrid}>
            <div className={styles.primaryColumn}>
              <section className={styles.statsGrid} aria-label="Customer and loyalty summary">
                <article className={styles.statCard}><span>Active customers</span><strong>1,284</strong><small className={styles.positive}><TrendingUp size={13} /> +8.1%</small></article>
                <article className={styles.statCard}><span>Loyalty members</span><strong>764</strong><small className={styles.orangeText}>59.5% enrolled</small></article>
                <article className={styles.statCard}><span>Repeat purchase</span><strong>62%</strong><small className={styles.positive}>Healthy rate</small></article>
              </section>

              <section className={styles.panel} aria-label="Customer directory">
                <div className={styles.panelHeading}>
                  <div><h2>Customer directory</h2><p>Search customer records and review loyalty tiers.</p></div>
                  <span className={styles.countPill}>{filteredCustomers.length} shown</span>
                </div>
                <div className={styles.toolbar}>
                  <label className={styles.searchBox}><Search size={17} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search customer" aria-label="Search customers by name, email, item, or ID" /></label>
                  <label className={styles.filterBox}><span>Tier</span><ChevronDown size={14} /><select aria-label="Filter customers by loyalty tier" value={tierFilter} onChange={event => setTierFilter(event.target.value as TierFilter)}>
                    <option>All tiers</option><option>Gold</option><option>Silver</option><option>Bronze</option>
                  </select></label>
                </div>
                <div className={styles.tableScroller}>
                  <table className={styles.customerTable}>
                    <thead><tr><th>Customer</th><th>Orders</th><th>Spent</th><th>Points</th><th>Tier</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead>
                    <tbody>
                      {filteredCustomers.map(customer => {
                        const tier = tierForPoints(customer.points);
                        return <tr key={customer.id}>
                          <td><button type="button" className={styles.customerIdentity} onClick={() => setSelectedCustomerId(customer.id)}><span className={styles.customerAvatar}>{initials(customer.name)}</span><span><strong>{customer.name}</strong><small>{customer.email}</small></span></button></td>
                          <td>{customer.orders}</td><td>{money(customer.spent)}</td><td><strong>{formatPoints(customer.points)} pts</strong></td>
                          <td><span className={`${styles.tierBadge} ${tierClass(tier)}`}>{tier}</span></td>
                          <td><button type="button" className={styles.iconButton} onClick={() => setSelectedCustomerId(customer.id)} aria-label={`View ${customer.name} profile`} title="View customer profile"><MoreHorizontal size={18} /></button></td>
                        </tr>;
                      })}
                      {filteredCustomers.length === 0 && <tr><td colSpan={6}><div className={styles.emptyState}><UsersRound size={24} /><strong>No customers found</strong><span>Try a different name, email, or loyalty tier.</span><button type="button" onClick={() => { setQuery(""); setTierFilter("All tiers"); }}>Clear filters</button></div></td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className={styles.tableFooter}><span>Customer records</span><button type="button" className={styles.textButton} onClick={resetExamples}><RotateCcw size={14} /> Reset records</button></div>
              </section>

              <section className={styles.panel} aria-label="Loyalty rewards">
                <div className={styles.panelHeading}>
                  <div><h2>Rewards catalog</h2><p>Manage which rewards customers can redeem.</p></div>
                  <button type="button" className={styles.smallPrimary} onClick={openRewardDialog}><Plus size={15} /> Add reward</button>
                </div>
                <div className={styles.rewardGrid}>
                  {rewards.map(reward => <article className={styles.rewardCard} key={reward.id}>
                    <div className={styles.rewardIcon}><Gift size={18} /></div>
                    <div className={styles.rewardDetails}><div className={styles.rewardTitleRow}><h3>{reward.name}</h3><span className={`${styles.statusBadge} ${reward.active ? styles.statusActive : styles.statusPaused}`}>{reward.active ? "Active" : "Paused"}</span></div>
                      <p>{reward.description || "No description provided."}</p><strong>{formatPoints(reward.pointsRequired)} points</strong><small>{formatPoints(reward.redemptions)} redemptions</small>
                    </div>
                    <div className={styles.rewardActions}>
                        <button type="button" className={styles.iconButton} onClick={() => toggleReward(reward)} aria-label={`${reward.active ? "Pause" : "Activate"} ${reward.name}`} title={reward.active ? "Pause reward" : "Activate reward"}>{reward.active ? <Check size={17} /> : <Sparkles size={17} />}</button>
                        <button type="button" className={styles.iconButton} onClick={() => removeReward(reward)} aria-label={`Remove ${reward.name}`} title="Remove reward"><X size={17} /></button>
                      </div>
                    </article>)}
                  {rewards.length === 0 && <div className={styles.emptyRewards}><Gift size={23} /><strong>No rewards yet</strong><span>Create a reward to build your loyalty catalog.</span></div>}
                </div>
              </section>
            </div>

            <aside className={styles.sideRail} aria-label="Loyalty summary">
              <section className={styles.programCard}>
                <span className={styles.programEyebrow}>LOYALTY PROGRAM</span>
                <h2>Brew Points</h2>
                <p>1 point per ₱10 spent · points expire after 12 months.</p>
                <div className={styles.programRule}><span>Points issued this month</span><strong>{formatPoints(metrics.pointsIssuedThisMonth)}</strong></div>
                <div className={styles.programRule}><span>Rewards redeemed</span><strong>{formatPoints(metrics.rewardsRedeemed)}</strong></div>
                <div className={styles.programFoot}><Gift size={15} /><span>{activeRewards.length} active rewards</span></div>
              </section>

              <section className={styles.topCustomerCard}>
                <div className={styles.panelHeading}><div><h2>Top customer</h2><p>Highest lifetime spend</p></div><Award size={19} /></div>
                {topCustomer ? <>
                  <div className={styles.topCustomerIdentity}><span className={styles.topCustomerAvatar}>{initials(topCustomer.name)}</span><div><strong>{topCustomer.name}</strong><span>{topCustomer.orders} orders · {money(topCustomer.spent)} spent</span></div></div>
                  <div className={styles.topCustomerMeta}><span className={`${styles.tierBadge} ${tierClass(tierForPoints(topCustomer.points))}`}>{tierForPoints(topCustomer.points)} member</span><strong>{formatPoints(topCustomer.points)} pts</strong></div>
                  <button type="button" className={styles.fullWidthButton} onClick={() => setSelectedCustomerId(topCustomer.id)}><Eye size={15} /> View customer profile</button>
                </> : <div className={styles.emptyMini}>Customer data will appear here.</div>}
              </section>

              <section className={styles.tierCard}>
                <div className={styles.panelHeading}><div><h2>Membership tiers</h2><p>Based on current point balances</p></div></div>
                <div className={styles.tierRow}><span className={`${styles.tierDot} ${styles.goldDot}`} /><span>Gold</span><strong>{tierCounts.Gold}</strong></div>
                <div className={styles.tierRow}><span className={`${styles.tierDot} ${styles.silverDot}`} /><span>Silver</span><strong>{tierCounts.Silver}</strong></div>
                <div className={styles.tierRow}><span className={`${styles.tierDot} ${styles.bronzeDot}`} /><span>Bronze</span><strong>{tierCounts.Bronze}</strong></div>
                <p className={styles.tierFootnote}>Membership thresholds: Gold 700+ points, Silver 400 to 699, Bronze below 400.</p>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {rewardDialog && <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setRewardDialog(false); }}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="create-reward-title">
          <div className={styles.modalHeader}><div><span className={styles.eyebrow}>LOYALTY PROGRAM</span><h2 id="create-reward-title">Create reward</h2><p>Set up a reward for the Brew Points catalog.</p></div><button type="button" className={styles.iconButton} onClick={() => setRewardDialog(false)} aria-label="Close create reward"><X size={19} /></button></div>
          <form onSubmit={createReward}>
            <label className={styles.field}>Reward name<input ref={rewardNameRef} value={rewardForm.name} onChange={event => setRewardForm({ ...rewardForm, name: event.target.value })} maxLength={100} placeholder="e.g. Free iced latte" required /></label>
            <label className={styles.field}>Description <span className={styles.optional}>(optional)</span><textarea value={rewardForm.description} onChange={event => setRewardForm({ ...rewardForm, description: event.target.value })} maxLength={240} rows={3} placeholder="Explain what the customer receives." /></label>
            <label className={styles.field}>Points required<input type="number" min="1" max="100000" step="1" value={rewardForm.pointsRequired} onChange={event => setRewardForm({ ...rewardForm, pointsRequired: event.target.value })} required /></label>
            {rewardFormError && <div className={styles.formError} role="alert">{rewardFormError}</div>}
            <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setRewardDialog(false)}>Cancel</button><button type="submit" className={styles.primaryButton}><Plus size={16} /> Save reward</button></div>
            
          </form>
        </section>
      </div>}

      {selectedCustomer && <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedCustomerId(null); }}>
        <section className={`${styles.modal} ${styles.profileModal}`} role="dialog" aria-modal="true" aria-labelledby="customer-profile-title">
          <div className={styles.modalHeader}><div><span className={styles.eyebrow}>CUSTOMER PROFILE</span><h2 id="customer-profile-title">Customer details</h2><p>Account and loyalty information.</p></div><button type="button" className={styles.iconButton} onClick={() => setSelectedCustomerId(null)} aria-label="Close customer profile"><X size={19} /></button></div>
          <div className={styles.profileHero}><span className={styles.profileAvatar}>{initials(selectedCustomer.name)}</span><div><h3>{selectedCustomer.name}</h3><span><Mail size={14} />{selectedCustomer.email}</span><span className={`${styles.tierBadge} ${tierClass(tierForPoints(selectedCustomer.points))}`}>{tierForPoints(selectedCustomer.points)} member</span></div></div>
          <div className={styles.profileStats}>
            <div><span>Total orders</span><strong>{selectedCustomer.orders}</strong></div>
            <div><span>Total spent</span><strong>{money(selectedCustomer.spent)}</strong></div>
            <div><span>Point balance</span><strong>{formatPoints(selectedCustomer.points)}</strong></div>
          </div>
          <div className={styles.profileInfoGrid}>
            <div><span>Customer ID</span><strong>{selectedCustomer.id}</strong></div>
            <div><span>Last visit</span><strong>{selectedCustomer.lastVisit}</strong></div>
            <div><span>Favorite item</span><strong>{selectedCustomer.favoriteItem}</strong></div>
            <div><span>Member since</span><strong>{selectedCustomer.joined}</strong></div>
          </div>
          <div className={styles.profileSectionHeading}><h3>Available rewards</h3></div>
          <div className={styles.profileRewardList}>
            {activeRewards.map(reward => <div className={styles.profileReward} key={reward.id}><div><strong>{reward.name}</strong><span>{formatPoints(reward.pointsRequired)} points</span></div><button type="button" className={styles.smallSecondary} disabled={selectedCustomer.points < reward.pointsRequired || !hydrated} onClick={() => redeemReward(selectedCustomer, reward)}>{selectedCustomer.points < reward.pointsRequired ? "Not enough points" : "Redeem"}</button></div>)}
            {activeRewards.length === 0 && <p className={styles.mutedText}>There are no active rewards available.</p>}
          </div>
          <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setSelectedCustomerId(null)}>Close profile</button><button type="button" className={styles.primaryButton} onClick={() => openPointsDialog(selectedCustomer)} disabled={!hydrated}><Wallet size={16} /> Adjust points</button></div>
          
        </section>
      </div>}

      {pointsCustomer && <div className={`${styles.modalBackdrop} ${styles.modalBackdropTop}`} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPointsCustomerId(null); }}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="adjust-points-title">
          <div className={styles.modalHeader}><div><span className={styles.eyebrow}>BREW POINTS</span><h2 id="adjust-points-title">Adjust customer points</h2><p>{pointsCustomer.name} currently has {formatPoints(pointsCustomer.points)} points.</p></div><button type="button" className={styles.iconButton} onClick={() => setPointsCustomerId(null)} aria-label="Close points adjustment"><X size={19} /></button></div>
          <form onSubmit={adjustPoints}>
            <label className={styles.field}>Adjustment<select value={pointsAction} onChange={event => setPointsAction(event.target.value as PointsAction)}><option value="add">Add points</option><option value="deduct">Deduct points</option></select></label>
            <label className={styles.field}>Points<input ref={pointsAmountRef} type="number" min="1" max="5000" step="1" value={pointsAmount} onChange={event => setPointsAmount(event.target.value)} required /></label>
            <label className={styles.field}>Reason<input value={pointsReason} onChange={event => setPointsReason(event.target.value)} maxLength={120} placeholder="e.g. Approved service recovery" required /></label>
            {pointsFormError && <div className={styles.formError} role="alert">{pointsFormError}</div>}
            <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setPointsCustomerId(null)}>Cancel</button><button type="submit" className={styles.primaryButton}><Check size={16} /> Save adjustment</button></div>
            
          </form>
        </section>
      </div>}
    </div>
  );
}
