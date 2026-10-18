import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Brand } from "@/components/schedu/brand";
import { Logout } from "@/components/schedu/logout";
import s from "@/components/schedu/schedu.module.css";

async function BusinessPreviewContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/business");
  return (
    <div className={s.site}>
      <header className={s.navbar}><Brand /><nav className={s.navLinks}><Link href="/auth/business">Business portal</Link><Logout /></nav></header>
      <main className={s.previewPage}>
        <span className={s.eyebrow}>BUSINESS OWNER PORTAL</span>
        <h1>Business Dashboard</h1>
        <p>Signed in as <strong>{user.email}</strong></p>
        <p className={s.demoBadge}>Design preview only. This is not yet restricted to verified shop owners. Do not enter real business information here until role based permissions are implemented.</p>
        <div className={s.previewGrid}>
          <section className={s.previewCard}><h2>Orders</h2><p>Manage pending, preparing, ready and completed orders.</p><span>Coming next</span></section>
          <section className={s.previewCard}><h2>Pickup Schedule</h2><p>Set available slots and manage pickup capacity.</p><span>Coming next</span></section>
          <section className={s.previewCard}><h2>Menu Management</h2><p>Organize products, prices, categories and availability.</p><span>Coming next</span></section>
          <section className={s.previewCard}><h2>Analytics</h2><p>Review sample order volume and sales reports.</p><span>Coming next</span></section>
        </div>
      </main>
    </div>
  );
}

export default function BusinessPreview() {
  return <Suspense fallback={<div style={{padding: "3rem"}}>Loading your business preview...</div>}><BusinessPreviewContent /></Suspense>;
}
