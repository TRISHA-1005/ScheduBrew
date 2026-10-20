import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessMenu } from "@/components/business/business-menu";

export const metadata: Metadata = {
  title: "Menu Management | ScheduBrew Owner Workspace",
  description: "Manage menu items, prices, availability and stock",
};

async function MenuContent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");
  // Authenticated user only; actual shop ownership must be verified server-side after database integration.
  return <BusinessMenu email={user.email ?? "Business owner"} />;
}

export default function MenuPage() {
  return <Suspense fallback={<div style={{ padding: "3rem" }}>Loading menu management...</div>}><MenuContent /></Suspense>;
}
