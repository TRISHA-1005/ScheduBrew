"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, ShoppingCart } from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import { Brand } from "@/components/schedu/brand";
import { readCart, cartDetail } from "./demo-order-data";
import s from "./customer.module.css";

const links = [
  { href: "/customer", label: "Discover" },
  { href: "/customer/orders", label: "My Orders" },
  { href: "/customer/rewards", label: "Rewards" },
  { href: "/customer/profile", label: "Profile" },
] as const;

export function CustomerNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCart = () => setCartCount(cartDetail(readCart()).count);
    updateCart();
    window.addEventListener("schedu-demo-cart-changed", updateCart);
    window.addEventListener("storage", updateCart);
    return () => {
      window.removeEventListener("schedu-demo-cart-changed", updateCart);
      window.removeEventListener("storage", updateCart);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  function isCurrent(href: string) {
    return href === "/customer" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className={s.topbar}>
      <div className={s.topbarInner}>
        <Brand />
        <button
          type="button"
          className={s.mobileMenuButton}
          aria-label={open ? "Close customer navigation" : "Open customer navigation"}
          aria-expanded={open}
          aria-controls="schedu-customer-navigation"
          onClick={() => setOpen(value => !value)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          <span>Menu</span>
          {cartCount > 0 && <span className={s.mobileCartDot} aria-label={`${cartCount} cart items`}>{cartCount > 99 ? "99+" : cartCount}</span>}
        </button>
        <nav
          id="schedu-customer-navigation"
          aria-label="Customer navigation"
          className={`${s.nav} ${open ? s.navOpen : ""}`}
        >
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              className={isCurrent(link.href) ? s.activeNav : ""}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/customer/cart"
            aria-current={isCurrent("/customer/cart") ? "page" : undefined}
            className={`${s.cartNavLink} ${isCurrent("/customer/cart") ? s.activeNav : ""}`}
            onClick={() => setOpen(false)}
          >
            <ShoppingCart size={16} aria-hidden="true" />
            Cart
            {cartCount > 0 && <span className={s.cartCount}>{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
          <Link href="/customer#browse" className={s.navCta} onClick={() => setOpen(false)}>
            <ShoppingBag size={16} aria-hidden="true" /> Start an Order
          </Link>
          <div className={s.userPill} title={email || "Customer account"} aria-label="Signed in customer">
            {(email?.split("@")[0] || "SB").slice(0, 2).toUpperCase()}
          </div>
          <Logout />
        </nav>
      </div>
    </header>
  );
}
