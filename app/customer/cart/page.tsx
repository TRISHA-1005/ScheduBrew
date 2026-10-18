import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartPage } from "@/components/customer/cart-page";

export default async function CustomerCartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <CartPage email={user.email || ""}/>;
}
