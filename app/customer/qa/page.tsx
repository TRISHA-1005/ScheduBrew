import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerQa } from "@/components/customer/customer-qa";

export const metadata = { title: "Customer Frontend QA" };

export default async function CustomerQaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <CustomerQa email={user.email || ""} />;
}
