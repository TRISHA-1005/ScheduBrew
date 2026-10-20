import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessSettings } from "@/components/business/business-settings";

export const metadata: Metadata = {
  title: "Business Settings | ScheduBrew Owner Workspace",
  description: "Manage business details, operating hours, notification preferences and subscription plans",
};

async function SettingsContent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");
  return <BusinessSettings email={user.email ?? "Business owner"} />;
}

export default function SettingsPage() {
  return <Suspense fallback={<div style={{ padding: "3rem" }}>Loading business settings...</div>}><SettingsContent /></Suspense>;
}
