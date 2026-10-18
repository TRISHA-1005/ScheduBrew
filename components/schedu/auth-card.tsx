"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import s from "./schedu.module.css";

type UserKind = "customer" | "business";

export function AuthCard({ kind }: { kind: UserKind }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isBusiness = kind === "business";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      router.push(isBusiness ? "/business" : "/customer");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.loginCard} aria-labelledby="login-heading">
      <div className={s.cardHeading}>
        {isBusiness && <span className={s.eyebrow}>MERCHANT PORTAL</span>}
        <h2 id="login-heading">{isBusiness ? "Welcome, partner!" : "Welcome back!"}</h2>
        <p>{isBusiness ? "Sign in to manage your ScheduBrew shop" : "Sign in to continue to ScheduBrew"}</p>
      </div>
      <form onSubmit={handleSubmit} className={s.form}>
        <label className={s.fieldLabel} htmlFor={`${kind}-email`}>Email address</label>
        <div className={s.fieldBox}>
          <Mail size={18} aria-hidden="true" />
          <input id={`${kind}-email`} type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy}/>
        </div>
        <label className={s.fieldLabel} htmlFor={`${kind}-password`}>Password</label>
        <div className={s.fieldBox}>
          <LockKeyhole size={18} aria-hidden="true" />
          <input id={`${kind}-password`} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy}/>
          <button className={s.eyeButton} type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}
          </button>
        </div>
        <div className={s.formTools}>
          <span className={s.secureLabel}><ShieldCheck size={16}/> Secure sign in</span>
          <Link href="/auth/forgot-password">Forgot password?</Link>
        </div>
        {error && <p role="alert" className={s.errorText}>{error}</p>}
        <button className={s.primaryButton} type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      {!isBusiness && (
        <>
          <div className={s.orDivider}><span>or continue with</span></div>
          <div className={s.socials}>
            <button type="button" disabled title="Google login will be configured later">Google</button>
            <button type="button" disabled title="Facebook login will be configured later">Facebook</button>
            <button type="button" disabled title="Apple login will be configured later">Apple</button>
          </div>
          <p className={s.comingSoon}>Social sign in will be available after provider setup.</p>
        </>
      )}
      <p className={s.formFooter}>
        {isBusiness ? "Need a shop account?" : "New to ScheduBrew?"}{" "}
        <Link href="/auth/sign-up">Create an account</Link>
      </p>
      {isBusiness && (
        <p className={s.previewNote}>Business access is a frontend preview. Shop ownership and staff permissions will be enforced when we add the database roles.</p>
      )}
    </section>
  );
}
