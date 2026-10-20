import Link from "next/link";
import { Brand } from "@/components/schedu/brand";
import s from "@/components/schedu/schedu.module.css";

type SignUpSuccessProps = {
  searchParams: Promise<{ role?: string | string[] }>;
};

export default async function SignUpSuccessPage({ searchParams }: SignUpSuccessProps) {
  const params = await searchParams;
  const requestedRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const isBusiness = requestedRole === "business_owner" || requestedRole === "business";
  const signInHref = isBusiness ? "/auth/business" : "/";

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
        <section className={s.signupChooser}>
          <span className={s.eyebrow}>ACCOUNT REGISTRATION</span>
          <h1>Check your email</h1>
          <p>
            Your {isBusiness ? "business owner" : "customer"} account request has been submitted. If email confirmation is enabled, open the confirmation link we sent you before signing in.
          </p>
          <div className={s.signupSuccessActions}>
            <Link className={s.primaryButton} href={signInHref}>Go to sign in</Link>
            <Link href="/auth/sign-up" className={s.signupSuccessSecondary}>Create another account</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
