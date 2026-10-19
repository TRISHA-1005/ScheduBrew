import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessAnalytics } from "@/components/business/business-analytics";

export const metadata: Metadata = {
  title: "Analytics and Reports | ScheduBrew Owner Workspace",
  description: "Sales, orders, pickup demand and customer retention analytics frontend prototype",
};

async function AnalyticsContent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");
  // Authentication is enforced. Merchant and branch reporting authorization will be added in the database phase.
  return <BusinessAnalytics email={user.email ?? "Business owner"} />;
}

export default function AnalyticsPage() {
  return <Suspense fallback={<div style={{ padding: "3rem" }}>Loading analytics and reports...</div>}><AnalyticsContent /></Suspense>;
}
