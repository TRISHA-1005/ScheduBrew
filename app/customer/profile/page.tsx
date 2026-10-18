import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerProfile } from "@/components/customer/customer-profile";

export default async function CustomerProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <CustomerProfile email={user.email || ""} />;
}
