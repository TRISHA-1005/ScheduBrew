import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessCustomers } from "@/components/business/business-customers";

export const metadata: Metadata = {
  title: "Customers and Loyalty | ScheduBrew Owner Workspace",
  description: "Customer directory and loyalty reward frontend prototype",
};

async function CustomersContent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/business");
  // Authentication is enforced. Merchant and branch ownership checks are added with the database phase.
  return <BusinessCustomers email={user.email ?? "Business owner"} />;
}

export default function CustomersPage() {
  return <Suspense fallback={<div style={{ padding: "3rem" }}>Loading customer and loyalty management...</div>}><CustomersContent /></Suspense>;
}
