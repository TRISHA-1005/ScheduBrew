import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessPickupSchedule } from "@/components/business/business-pickup-schedule";

export const metadata: Metadata = {
  title: "Pickup Schedule | ScheduBrew Owner Workspace",
  description: "Pickup scheduling and capacity planning frontend demonstration",
};

async function PickupScheduleContent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");
  // Authentication only. Owner authorization and branch membership require PostgreSQL later.
  return <BusinessPickupSchedule email={user.email ?? "Business owner"} />;
}

export default function PickupSchedulePage() {
  return <Suspense fallback={<div style={{ padding: "3rem" }}>Loading pickup schedule...</div>}><PickupScheduleContent /></Suspense>;
}
