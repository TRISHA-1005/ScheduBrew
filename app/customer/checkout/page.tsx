import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutPage } from "@/components/customer/checkout-page";

export default async function CustomerCheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <CheckoutPage email={user.email || ""}/>;
}
