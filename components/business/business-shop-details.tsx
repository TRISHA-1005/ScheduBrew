"use client";

import { useEffect, useState } from "react";
import { BUSINESS_CHANGED_EVENT } from "./demo-business-data";
import { DEFAULT_BUSINESS_SETTINGS, readBusinessSettings, type BusinessProfile } from "./business-settings-data";

export function BusinessShopDetails() {
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_SETTINGS.profile);

  useEffect(() => {
    const refresh = () => setProfile(readBusinessSettings().profile);
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(BUSINESS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(BUSINESS_CHANGED_EVENT, refresh);
    };
  }, []);

  const details = [profile.branchName, profile.city].filter(Boolean).join(" · ");
  return <div><strong>{profile.businessName || "ScheduBrew Business"}</strong><span>{details || "Business profile"} · Demo shop</span></div>;
}
