import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findShop } from "@/data/schedu-mock";
import { ShopMenu } from "@/components/customer/shop-menu";

export default async function CustomerShopPage({params}:{params:Promise<{shopId:string}>}) {
  const {shopId}=await params;
  const shop=findShop(shopId);
  if(!shop) notFound();
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect('/');
  return <ShopMenu shop={shop} email={user.email||''}/>;
}
