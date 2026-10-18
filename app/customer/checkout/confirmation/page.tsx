import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutConfirmation } from "@/components/customer/checkout-confirmation";

export default async function CustomerConfirmationPage({ searchParams }: {searchParams: Promise<{ref?: string}>}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const query = await searchParams;
  return <CheckoutConfirmation email={user.email || ""} reference={query.ref || ""}/>;
}
