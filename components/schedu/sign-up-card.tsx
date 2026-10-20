"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import s from "./schedu.module.css";

type AccountKind = "customer" | "business";

type SignUpCardProps = {
  kind: AccountKind;
};

export function SignUpCard({ kind }: SignUpCardProps) {
  const router = useRouter();
  const isBusiness = kind === "business";
  const loginHref = isBusiness ? "/auth/business" : "/";

  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match. Please try again.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const role = isBusiness ? "business_owner" : "customer";
      const successPath = `/auth/sign-up-success?role=${role}`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim(),
            phone: phone.trim(),
            ...(isBusiness
              ? {
                  shop_name: shopName.trim(),
                  business_address: businessAddress.trim(),
                }
              : {}),
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(successPath)}`,
        },
      });

      if (signUpError) throw signUpError;
      router.push(data.session ? (isBusiness ? "/business" : "/customer") : successPath);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.signupCard} aria-labelledby="signup-heading">
      <Link className={s.signupBackLink} href={loginHref}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
      </Link>
      <div className={s.signupCardHeading}>
        <span className={s.eyebrow}>{isBusiness ? "BUSINESS OWNER ACCOUNT" : "CUSTOMER ACCOUNT"}</span>
        <h2 id="signup-heading">{isBusiness ? "Register your shop" : "Create your account"}</h2>
        <p>
          {isBusiness
            ? "Set up your owner profile to manage your shop on ScheduBrew."
            : "Join ScheduBrew to discover local shops and plan your pickup."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={s.form}>
        {isBusiness && (
          <>
            <label className={s.fieldLabel} htmlFor="signup-shop-name">Shop or business name</label>
            <div className={s.fieldBox}>
              <Store size={18} aria-hidden="true" />
              <input id="signup-shop-name" name="shopName" autoComplete="organization" placeholder="Enter your shop name" value={shopName} onChange={(event) => setShopName(event.target.value)} required disabled={busy} />
            </div>
          </>
        )}

        <label className={s.fieldLabel} htmlFor="signup-full-name">{isBusiness ? "Owner or contact person" : "Full name"}</label>
        <div className={s.fieldBox}>
          <UserRound size={18} aria-hidden="true" />
          <input id="signup-full-name" name="fullName" autoComplete="name" placeholder={isBusiness ? "Enter the owner's full name" : "Enter your full name"} value={fullName} onChange={(event) => setFullName(event.target.value)} required disabled={busy} />
        </div>

        <label className={s.fieldLabel} htmlFor="signup-email">Email address</label>
        <div className={s.fieldBox}>
          <Mail size={18} aria-hidden="true" />
          <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} />
        </div>

        <label className={s.fieldLabel} htmlFor="signup-phone">Mobile number</label>
        <div className={s.fieldBox}>
          <Phone size={18} aria-hidden="true" />
          <input id="signup-phone" name="phone" type="tel" autoComplete="tel" placeholder="e.g. 09XX XXX XXXX" value={phone} onChange={(event) => setPhone(event.target.value)} required disabled={busy} />
        </div>

        {isBusiness && (
          <>
            <label className={s.fieldLabel} htmlFor="signup-business-address">Business address</label>
            <div className={s.fieldBox}>
              <MapPin size={18} aria-hidden="true" />
              <input id="signup-business-address" name="businessAddress" autoComplete="street-address" placeholder="Street, barangay, city" value={businessAddress} onChange={(event) => setBusinessAddress(event.target.value)} required disabled={busy} />
            </div>
          </>
        )}

        <label className={s.fieldLabel} htmlFor="signup-password">Password</label>
        <div className={s.fieldBox}>
          <LockKeyhole size={18} aria-hidden="true" />
          <input id="signup-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
          <button className={s.eyeButton} type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label className={s.fieldLabel} htmlFor="signup-confirm-password">Confirm password</label>
        <div className={s.fieldBox}>
          <ShieldCheck size={18} aria-hidden="true" />
          <input id="signup-confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password again" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required disabled={busy} />
          <button className={s.eyeButton} type="button" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword((value) => !value)}>
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p role="alert" className={s.errorText}>{error}</p>}
        <button className={s.primaryButton} type="submit" disabled={busy}>
          {busy ? "Creating account..." : isBusiness ? "Create business account" : "Create customer account"}
        </button>
      </form>

      <p className={s.signupPrivacyNote}>
        By creating an account, you agree to provide accurate account details and keep your sign in credentials secure.
      </p>
      <p className={s.formFooter}>
        Already registered? <Link href={loginHref}>Sign in</Link>
      </p>
    </section>
  );
}
