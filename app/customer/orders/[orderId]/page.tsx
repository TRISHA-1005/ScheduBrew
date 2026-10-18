import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderTracking } from "@/components/customer/order-tracking";

export default async function CustomerOrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { orderId } = await params;
  return <OrderTracking email={user.email || ""} reference={orderId} />;
}
