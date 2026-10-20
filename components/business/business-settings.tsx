"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight, BarChart3, Bell, Building2, CalendarClock, CheckCircle2,
  ChevronRight, CircleAlert, Clock3, Coffee, CreditCard, LayoutDashboard,
  ClipboardList, Mail, MapPin, Menu, Phone, RotateCcw, Save, Settings,
  ShieldCheck, UsersRound, X,
} from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import {
  BUSINESS_DAY_KEYS, BUSINESS_DAY_LABELS, DEFAULT_BUSINESS_SETTINGS,
  normalizeBusinessSettings, readBusinessSettings, writeBusinessSettings,
  type BusinessDayKey, type BusinessNotifications, type BusinessProfile,
  type BusinessSettings as BusinessSettingsModel, type OperatingDay, type SubscriptionPlan,
} from "./business-settings-data";
import { BusinessShopDetails } from "./business-shop-details";
import shell from "./dashboard.module.css";
import styles from "./settings.module.css";

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { name: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { name: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { name: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { name: "Customers", icon: UsersRound, href: "/business/customers", batch: 5 },
  { name: "Analytics", icon: BarChart3, href: "/business/analytics", batch: 6 },
  { name: "Settings", icon: Settings, href: "/business/settings", batch: 8 },
] as const;

const plans: Array<{
  name: SubscriptionPlan;
  price: string;
  description: string;
  features: string[];
}> = [
  { name: "Starter", price: "PHP 0 / month", description: "The essentials for a single shop.", features: ["Business profile and hours", "Order and pickup demo", "Basic customer directory"] },
  { name: "Growth", price: "PHP 499 / month", description: "More visibility for a growing cafe.", features: ["Everything in Starter", "Loyalty and reward demo", "Analytics and report demo"] },
  { name: "Pro", price: "PHP 999 / month", description: "An illustrative plan for a larger operation.", features: ["Everything in Growth", "Expanded planning examples", "Priority support example"] },
];

const notificationItems: Array<{ key: keyof BusinessNotifications; title: string; description: string }> = [
  { key: "orderUpdates", title: "Order updates", description: "Show a preference for order status and preparation updates." },
  { key: "pickupReminders", title: "Pickup reminders", description: "Show a preference for reminders about upcoming pickup windows." },
  { key: "lowCapacityAlerts", title: "Pickup capacity alerts", description: "Flag sample windows that are approaching their configured capacity." },
  { key: "loyaltyActivity", title: "Customer and loyalty activity", description: "Show a preference for customer visits, points and reward activity." },
  { key: "weeklySummary", title: "Weekly business summary", description: "Opt in to a sample weekly summary preference." },
];

function avatar(email: string): string {
  return (email.split("@")[0] || "SB").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB";
}

function minutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function BusinessSettings({ email }: { email: string }) {
  const [settings, setSettings] = useState<BusinessSettingsModel>(DEFAULT_BUSINESS_SETTINGS);
  const [profileDraft, setProfileDraft] = useState<BusinessProfile>(DEFAULT_BUSINESS_SETTINGS.profile);
  const [hoursDraft, setHoursDraft] = useState<Record<BusinessDayKey, OperatingDay>>(DEFAULT_BUSINESS_SETTINGS.operatingHours);
  const [notificationDraft, setNotificationDraft] = useState<BusinessNotifications>(DEFAULT_BUSINESS_SETTINGS.notifications);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"success" | "error">("success");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const next = readBusinessSettings();
      setSettings(next);
      setProfileDraft(next.profile);
      setHoursDraft(next.operatingHours);
      setNotificationDraft(next.notifications);
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
    if (!mobileMenu) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileMenu]);

  function commit(nextValue: BusinessSettingsModel, successMessage: string): boolean {
    const next = normalizeBusinessSettings(nextValue);
    if (!writeBusinessSettings(next)) {
      setNoticeKind("error");
      setNotice("Settings could not be saved in this browser. Check browser storage permissions and try again.");
      return false;
    }
    setSettings(next);
    setNoticeKind("success");
    setNotice(successMessage);
    return true;
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profile = { ...profileDraft };
    profile.businessName = profile.businessName.trim();
    profile.branchName = profile.branchName.trim();
    profile.email = profile.email.trim();
    profile.phone = profile.phone.trim();
    profile.address = profile.address.trim();
    profile.city = profile.city.trim();
    profile.province = profile.province.trim();
    profile.postalCode = profile.postalCode.trim();
    profile.description = profile.description.trim();

    if (!profile.businessName || !profile.branchName || !profile.city) {
      setNoticeKind("error"); setNotice("Enter a business name, branch name and city before saving."); return;
    }
    if (!validEmail(profile.email)) {
      setNoticeKind("error"); setNotice("Enter a valid contact email address."); return;
    }
    if (profile.phone.length > 32 || profile.address.length > 120) {
      setNoticeKind("error"); setNotice("Check the phone number and address lengths."); return;
    }
    if (commit({ ...settings, profile }, "Business profile saved to this browser.")) setProfileDraft(profile);
  }

  function updateHour(day: BusinessDayKey, field: keyof OperatingDay, value: string | boolean) {
    setHoursDraft(current => {
      const updated: OperatingDay = { ...current[day] };
      if (field === "closed" && typeof value === "boolean") updated.closed = value;
      if ((field === "open" || field === "close") && typeof value === "string") updated[field] = value;
      return { ...current, [day]: updated };
    });
  }

  function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    for (const day of BUSINESS_DAY_KEYS) {
      const value = hoursDraft[day];
      if (value.closed) continue;
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.open) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.close) || minutes(value.close) <= minutes(value.open)) {
        setNoticeKind("error"); setNotice(`${BUSINESS_DAY_LABELS[day]} needs a valid opening time and a closing time later on the same day.`); return;
      }
    }
    if (commit({ ...settings, operatingHours: hoursDraft }, "Operating hours saved. Pickup Schedule now marks out-of-hours windows unavailable.")) setHoursDraft({ ...hoursDraft });
  }

  function saveNotifications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commit({ ...settings, notifications: notificationDraft }, "Notification preferences saved to this browser.");
  }

  function choosePlan(plan: SubscriptionPlan) {
    if (settings.subscription.plan === plan) {
      setNoticeKind("success"); setNotice(`${plan} is already the selected demonstration plan.`); return;
    }
    const next = { ...settings, subscription: { plan, updatedAt: new Date().toISOString() } };
    commit(next, `Selected the ${plan} demonstration plan. No payment details were collected and no charge was made.`);
  }

  function resetSettings() {
    if (!window.confirm("Reset the business profile, operating hours, notifications and demo plan to their sample values?")) return;
    if (commit(DEFAULT_BUSINESS_SETTINGS, "Sample business settings restored.")) {
      setProfileDraft(DEFAULT_BUSINESS_SETTINGS.profile);
      setHoursDraft(DEFAULT_BUSINESS_SETTINGS.operatingHours);
      setNotificationDraft(DEFAULT_BUSINESS_SETTINGS.notifications);
    }
  }

  return (
    <div className={`${shell.workspace} ${styles.workspace}`}>
      {mobileMenu && <button type="button" className={shell.mobileScrim} aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <aside className={`${shell.sidebar} ${mobileMenu ? shell.sidebarOpen : ""}`} aria-label="Business owner navigation">
        <div className={shell.sideBrand}>
          <Link href="/business" className={shell.brandLink} onClick={() => setMobileMenu(false)}>
            <span className={shell.trcBadge}>TR<span>C</span></span>
            <span><strong>Schedu<span>Brew</span></strong><small>OWNER WORKSPACE</small></span>
          </Link>
          <button type="button" className={shell.closeSide} onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className={shell.sideNavigation} aria-label="Business modules">
          {nav.map(({ name, icon: Icon, href, batch }) => (
            <Link key={name} href={href} aria-current={batch === 8 ? "page" : undefined} className={`${shell.sideItem} ${batch === 8 ? shell.sideActive : ""}`} onClick={() => setMobileMenu(false)}>
              <Icon size={18} aria-hidden="true" /><span>{name}</span>
            </Link>
          ))}
        </nav>
        <div className={shell.sideFoot}>
          <div className={shell.sideFootTitle}><ShieldCheck size={17} /> Business controls</div>
          <p>Manage shop information, opening times and workspace preferences.</p>
          <span>Frontend demo · Batch 8</span>
        </div>
      </aside>

      <div className={shell.mainArea}>
        <header className={shell.topbar}>
          <div className={shell.topLeft}>
            <button type="button" className={shell.mobileMenu} onClick={() => setMobileMenu(true)} aria-label="Open business navigation"><Menu size={21} /></button>
            <BusinessShopDetails />
          </div>
          <div className={shell.topRight}>
            <span className={shell.demoTopBadge}><span /> Test mode</span>
            <div className={shell.avatar} title={email} aria-label={`Signed in user ${email}`}>{avatar(email)}</div>
            <Logout />
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.pageHeading}>
            <div><span className={styles.eyebrow}>BUSINESS OWNER WORKSPACE</span><h1>Business settings</h1><p>Keep your shop details, opening hours and preferences up to date.</p></div>
            <button type="button" className={styles.resetButton} onClick={resetSettings} disabled={!hydrated}><RotateCcw size={16} /> Reset sample settings</button>
          </div>

          <div className={styles.demoNotice} role="note"><CircleAlert size={18} /><span>Frontend demonstration only. These settings are stored in this browser. Subscription plans and prices are examples, and no billing or notifications are sent.</span></div>
          {notice && <div className={`${styles.notice} ${noticeKind === "error" ? styles.noticeError : styles.noticeSuccess}`} role={noticeKind === "error" ? "alert" : "status"}><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={17} /></button></div>}

          <section className={styles.card} aria-labelledby="profile-heading">
            <div className={styles.sectionHeading}><span className={styles.sectionIcon}><Building2 size={19} /></span><div><h2 id="profile-heading">Business profile</h2><p>Details shown in your business workspace.</p></div></div>
            <form onSubmit={saveProfile} className={styles.profileForm}>
              <label>Business name<input value={profileDraft.businessName} onChange={event => setProfileDraft({ ...profileDraft, businessName: event.target.value })} maxLength={80} required /></label>
              <label>Branch name<input value={profileDraft.branchName} onChange={event => setProfileDraft({ ...profileDraft, branchName: event.target.value })} maxLength={60} required /></label>
              <label>Contact email<span className={styles.inputIcon}><Mail size={15} /><input type="email" value={profileDraft.email} onChange={event => setProfileDraft({ ...profileDraft, email: event.target.value })} maxLength={120} required /></span></label>
              <label>Phone number<span className={styles.inputIcon}><Phone size={15} /><input type="tel" value={profileDraft.phone} onChange={event => setProfileDraft({ ...profileDraft, phone: event.target.value })} maxLength={32} /></span></label>
              <label className={styles.wideField}>Street address<span className={styles.inputIcon}><MapPin size={15} /><input value={profileDraft.address} onChange={event => setProfileDraft({ ...profileDraft, address: event.target.value })} maxLength={120} /></span></label>
              <label>City<input value={profileDraft.city} onChange={event => setProfileDraft({ ...profileDraft, city: event.target.value })} maxLength={60} required /></label>
              <label>Province or region<input value={profileDraft.province} onChange={event => setProfileDraft({ ...profileDraft, province: event.target.value })} maxLength={60} /></label>
              <label>Postal code<input value={profileDraft.postalCode} onChange={event => setProfileDraft({ ...profileDraft, postalCode: event.target.value })} maxLength={16} /></label>
              <label className={styles.wideField}>Short description<textarea value={profileDraft.description} onChange={event => setProfileDraft({ ...profileDraft, description: event.target.value })} rows={3} maxLength={180} /></label>
              <div className={styles.formFooter}><span>Saved profile details update the page headers in the owner workspace.</span><button type="submit" className={styles.primaryButton} disabled={!hydrated}><Save size={16} /> Save business profile</button></div>
            </form>
          </section>

          <section className={styles.card} aria-labelledby="hours-heading">
            <div className={styles.sectionHeading}><span className={styles.sectionIcon}><CalendarClock size={19} /></span><div><h2 id="hours-heading">Weekly operating hours</h2><p>Pickup Schedule uses these hours to mark unavailable time windows.</p></div></div>
            <form onSubmit={saveHours}>
              <div className={styles.hoursTable}>
                <div className={styles.hoursHeader}><span>Day</span><span>Opens</span><span>Closes</span><span>Availability</span></div>
                {BUSINESS_DAY_KEYS.map(day => {
                  const value = hoursDraft[day];
                  return <div className={`${styles.hoursRow} ${value.closed ? styles.closedRow : ""}`} key={day}>
                    <strong>{BUSINESS_DAY_LABELS[day]}</strong>
                    <label className={styles.timeField}><span className={styles.visuallyHidden}>{BUSINESS_DAY_LABELS[day]} opening time</span><input type="time" value={value.open} disabled={value.closed} onChange={event => updateHour(day, "open", event.target.value)} required={!value.closed} /></label>
                    <label className={styles.timeField}><span className={styles.visuallyHidden}>{BUSINESS_DAY_LABELS[day]} closing time</span><input type="time" value={value.close} disabled={value.closed} onChange={event => updateHour(day, "close", event.target.value)} required={!value.closed} /></label>
                    <label className={styles.closedToggle}><input type="checkbox" checked={value.closed} onChange={event => updateHour(day, "closed", event.target.checked)} /><span>{value.closed ? "Closed" : "Open"}</span></label>
                  </div>;
                })}
              </div>
              <div className={styles.formFooter}><span><Clock3 size={15} /> Uses your browser's local calendar for day selection.</span><button type="submit" className={styles.primaryButton} disabled={!hydrated}><Save size={16} /> Save operating hours</button></div>
            </form>
          </section>

          <section className={styles.card} aria-labelledby="notifications-heading">
            <div className={styles.sectionHeading}><span className={styles.sectionIcon}><Bell size={19} /></span><div><h2 id="notifications-heading">Notification preferences</h2><p>Choose the types of updates you would want to receive when notification delivery is connected.</p></div></div>
            <form onSubmit={saveNotifications}>
              <div className={styles.preferenceList}>
                {notificationItems.map(item => <label className={styles.preferenceRow} key={item.key}>
                  <span className={styles.preferenceCopy}><strong>{item.title}</strong><small>{item.description}</small></span>
                  <span className={styles.switchWrap}><input type="checkbox" checked={notificationDraft[item.key]} onChange={event => setNotificationDraft({ ...notificationDraft, [item.key]: event.target.checked })} /><span aria-hidden="true" /></span>
                </label>)}
              </div>
              <div className={styles.formFooter}><span>Preferences only. This batch does not send emails, push messages or SMS.</span><button type="submit" className={styles.primaryButton} disabled={!hydrated}><Save size={16} /> Save preferences</button></div>
            </form>
          </section>

          <section className={styles.card} aria-labelledby="subscription-heading">
            <div className={styles.sectionHeading}><span className={styles.sectionIcon}><CreditCard size={19} /></span><div><h2 id="subscription-heading">Subscription plan</h2><p>Preview example plan options without connecting a payment provider.</p></div></div>
            <div className={styles.currentPlan}>
              <div><span className={styles.currentPlanLabel}>SELECTED DEMO PLAN</span><h3>{settings.subscription.plan}</h3><p>{plans.find(plan => plan.name === settings.subscription.plan)?.description}</p></div>
              <span className={styles.planStatus}><CheckCircle2 size={15} /> Demo selected</span>
            </div>
            <div className={styles.planGrid}>
              {plans.map(plan => {
                const selected = settings.subscription.plan === plan.name;
                return <article className={`${styles.planCard} ${selected ? styles.planSelected : ""}`} key={plan.name}>
                  <div className={styles.planCardTop}><h3>{plan.name}</h3>{selected && <span className={styles.selectedPill}>Current</span>}</div>
                  <strong className={styles.planPrice}>{plan.price}</strong><p>{plan.description}</p>
                  <ul>{plan.features.map(feature => <li key={feature}><CheckCircle2 size={15} />{feature}</li>)}</ul>
                  <button type="button" className={selected ? styles.secondaryButton : styles.primaryButton} onClick={() => choosePlan(plan.name)} disabled={!hydrated || selected}>{selected ? "Selected plan" : `Choose ${plan.name}`}<ChevronRight size={16} /></button>
                </article>;
              })}
            </div>
            <p className={styles.billingNote}><ShieldCheck size={16} /> Demo plan changes are stored locally. No payment method is requested, no subscription is created, and no charge is made.</p>
          </section>

          <footer className={styles.footer}><span>© ScheduBrew by The Ready Counter · Business frontend prototype</span><Link href="/business/analytics">View reports <ArrowRight size={14} /></Link></footer>
        </main>
      </div>
    </div>
  );
}
