import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerOrders } from "@/components/customer/customer-orders";

export default async function CustomerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <CustomerOrders email={user.email || ""} />;
}
