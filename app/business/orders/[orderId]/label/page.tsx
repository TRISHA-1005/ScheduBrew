import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessPickupLabel } from "@/components/business/business-pickup-label";

export const metadata: Metadata = { title: "Pickup Label | ScheduBrew" };

async function LabelContent({ orderId }: { orderId: string }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");
  return <BusinessPickupLabel orderId={orderId} />;
}

export default async function PickupLabelPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <Suspense fallback={<div>Loading label...</div>}><LabelContent orderId={orderId} /></Suspense>;
}
