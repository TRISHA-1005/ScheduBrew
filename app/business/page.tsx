import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessDashboard } from "@/components/business/business-dashboard";

export const metadata: Metadata = {
  title: "Business Dashboard | ScheduBrew",
  description: "ScheduBrew business owner dashboard",
};

async function BusinessDashboardContent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");

  // AUTHENTICATION ONLY: Shop ownership / staff authorization is not yet implemented.
  // Dashboard data will be connected to merchant records during backend integration.
  return <BusinessDashboard email={user.email ?? "Business owner"} />;
}

export default function BusinessPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem", fontFamily: "Arial, sans-serif" }}>Loading business dashboard...</div>}>
      <BusinessDashboardContent />
    </Suspense>
  );
}
