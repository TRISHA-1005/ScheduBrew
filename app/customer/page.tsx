import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerDiscover } from "@/components/customer/discover";

export default async function CustomerPage({searchParams}:{searchParams:Promise<{category?:string}>}) {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect('/');
  const query=await searchParams;
  return <CustomerDiscover email={user.email||''} initialCategory={query?.category||'all'} />;
}
