import { requireAccountType } from "@/lib/supabase/require-account";

export default async function BusinessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAccountType("business_owner");
  return children;
}
