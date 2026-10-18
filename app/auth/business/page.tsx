import Link from "next/link";
import { Brand } from "@/components/schedu/brand";
import { AuthCard } from "@/components/schedu/auth-card";
import s from "@/components/schedu/schedu.module.css";

export default function BusinessLoginPage() {
  return (
    <div className={s.site}>
      <header className={s.navbar}>
        <Brand />
        <nav className={s.navLinks} aria-label="Main navigation">
          <Link href="/">Customer sign in</Link>
          <Link className={s.orderButton} href="/auth/business">Business portal</Link>
        </nav>
      </header>
      <main className={s.businessMain}>
        <section className={s.businessHero}>
          <div className={s.businessHeroPhoto} />
          <div className={s.businessHeroCopy}>
            <span className={s.businessHeroEyebrow}>SCHEDUBREW FOR BUSINESS</span>
            <h1>Smarter orders.<br/><span>Smoother service.</span></h1>
            <p>One workspace to manage your menu, incoming orders, and scheduled pickups.</p>
            <div className={s.businessBenefits}><span>✓ Order management</span><span>✓ Pickup schedules</span><span>✓ Shop analytics</span></div>
          </div>
        </section>
        <AuthCard kind="business" />
      </main>
      <p className={s.portalLink}>Ordering as a customer? <Link href="/">Go to Customer Sign In →</Link></p>
    </div>
  );
}
