import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerRewards } from "@/components/customer/customer-rewards";

export default async function CustomerRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <CustomerRewards email={user.email || ""} />;
}
