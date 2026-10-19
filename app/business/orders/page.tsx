import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessOrders } from "@/components/business/business-orders";

export const metadata: Metadata = {
  title: "Orders | ScheduBrew Owner Workspace",
  description: "Business owner order management frontend preview",
};

async function OrdersContent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");
  // Authentication only. Ownership and branch permissions will be implemented with PostgreSQL.
  return <BusinessOrders email={user.email ?? "Business owner"} />;
}

export default function OrdersPage() {
  return <Suspense fallback={<div style={{ padding: "3rem" }}>Loading orders...</div>}><OrdersContent /></Suspense>;
}
