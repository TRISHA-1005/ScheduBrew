import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ScheduBrewAccountType = "customer" | "business_owner";

/**
 * Enforce the account type on the server before rendering a protected portal.
 * Database Row Level Security remains the real data-access boundary.
 */
export async function requireAccountType(expected: ScheduBrewAccountType) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(expected === "business_owner" ? "/auth/business" : "/");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect(expected === "business_owner" ? "/auth/business" : "/");
  }

  if (profile.account_type !== expected) {
    redirect(profile.account_type === "business_owner" ? "/business" : "/customer");
  }

  return { supabase, user, profile };
}
