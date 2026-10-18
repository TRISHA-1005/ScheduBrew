"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import s from "./schedu.module.css";

export function Logout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button className={s.logoutButton} type="button" disabled={busy} onClick={async () => {
      setBusy(true);
      const { error } = await createClient().auth.signOut();
      if (error) { alert(error.message); setBusy(false); return; }
      router.push("/");
      router.refresh();
    }}>
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
