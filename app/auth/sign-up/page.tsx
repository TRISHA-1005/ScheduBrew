import Link from "next/link";
import { Brand } from "@/components/schedu/brand";
import { SignUpCard } from "@/components/schedu/sign-up-card";
import s from "@/components/schedu/schedu.module.css";

type SignUpPageProps = {
  searchParams: Promise<{ role?: string | string[] }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const requestedRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const kind = requestedRole === "business" || requestedRole === "business_owner"
    ? "business"
    : requestedRole === "customer"
      ? "customer"
      : null;

  return (
    <div className={s.site}>
      <header className={s.navbar}>
        <Brand />
        <nav className={s.navLinks} aria-label="Account navigation">
          <Link href="/">Customer sign in</Link>
          <Link className={s.orderButton} href="/auth/business">Business owner sign in</Link>
        </nav>
      </header>

      <main className={s.signupMain}>
        {kind ? (
          <>
            <section className={s.signupHero}>
              <span className={s.businessHeroEyebrow}>{kind === "business" ? "GROW WITH SCHEDUBREW" : "YOUR NEXT FAVORITE IS CLOSER"}</span>
              <h1>{kind === "business" ? <>Bring your shop<br /><span>to the next level.</span></> : <>Good coffee.<br /><span>Better timing.</span></>}</h1>
              <p>{kind === "business" ? "Manage your menu, organize pickup orders, and make it easier for customers to find your shop." : "Discover local cafes, plan your pickup, and spend less time waiting in line."}</p>
              <ul className={s.signupBenefits}>
                {kind === "business" ? (
                  <>
                    <li>Manage your shop profile and menu</li>
                    <li>Organize incoming orders and pickups</li>
                    <li>Review customer and sales activity</li>
                  </>
                ) : (
                  <>
                    <li>Explore cafes and neighborhood favorites</li>
                    <li>Schedule a convenient pickup</li>
                    <li>Keep your orders and rewards together</li>
                  </>
                )}
              </ul>
            </section>
            <SignUpCard kind={kind} />
          </>
        ) : (
          <section className={s.signupChooser}>
            <span className={s.eyebrow}>WELCOME TO SCHEDUBREW</span>
            <h1>Create your account</h1>
            <p>Choose the account that matches how you want to use ScheduBrew.</p>
            <div className={s.signupChoices}>
              <Link href="/auth/sign-up?role=customer" className={s.signupChoice}>
                <span className={s.signupChoiceIcon}>C</span>
                <span className={s.signupChoiceTitle}>Customer account</span>
                <span className={s.signupChoiceText}>Find shops, order ahead, schedule pickups, and manage rewards.</span>
                <span className={s.signupChoiceAction}>Continue as customer</span>
              </Link>
              <Link href="/auth/sign-up?role=business" className={s.signupChoice}>
                <span className={s.signupChoiceIcon}>B</span>
                <span className={s.signupChoiceTitle}>Business owner account</span>
                <span className={s.signupChoiceText}>Register your shop and manage menus, orders, and pickup schedules.</span>
                <span className={s.signupChoiceAction}>Continue as business owner</span>
              </Link>
            </div>
            <p className={s.formFooter}>Already have an account? <Link href="/">Sign in</Link></p>
          </section>
        )}
      </main>
    </div>
  );
}
