/**
 * BATCH 5: Frontend-only local demonstration data.
 * Preferences and favorites are stored in this browser, not in Supabase.
 * LocalStorage is NOT a substitute for server authorization or a real customer profile database.
 */
import { shops } from "@/data/schedu-mock";
import { readOrders, type DemoOrder } from "./demo-order-data";
import { progressFor } from "./demo-tracking-data";

export type DemoPreferences = {
  displayName: string;
  preferredLocation: string;
  pickupWindow: string;
  readyAlerts: boolean;
  promoAlerts: boolean;
};

export const PROFILE_CHANGED = "schedu-demo-profile-changed";
export const FAVORITES_CHANGED = "schedu-demo-favorites-changed";

export function accountKey(email: string, name: "profile" | "favorites"): string {
  // Per signed-in email on this device only. This is isolation for a demo, not security.
  return `schedu_demo_${name}_v1_${encodeURIComponent(email.trim().toLowerCase())}`;
}

export function initialPreferences(): DemoPreferences {
  return {
    displayName: "",
    preferredLocation: "Pasig City",
    pickupWindow: "15:00-16:00",
    readyAlerts: true,
    promoAlerts: false,
  };
}

const locations = ["Pasig City", "Ortigas", "Mandaluyong", "No preference"] as const;
const pickupWindows = ["10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "No preference"] as const;
export const availableLocations: readonly string[] = locations;
export const availableWindows: readonly string[] = pickupWindows;

export function readPreferences(email: string): DemoPreferences {
  const defaults = initialPreferences();
  if (!email || typeof window === "undefined") return defaults;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(accountKey(email, "profile")) || "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
    const p = parsed as Partial<DemoPreferences>;
    return {
      displayName: typeof p.displayName === "string" ? p.displayName.slice(0, 70) : "",
      preferredLocation: typeof p.preferredLocation === "string" && locations.includes(p.preferredLocation as typeof locations[number]) ? p.preferredLocation : defaults.preferredLocation,
      pickupWindow: typeof p.pickupWindow === "string" && pickupWindows.includes(p.pickupWindow as typeof pickupWindows[number]) ? p.pickupWindow : defaults.pickupWindow,
      readyAlerts: typeof p.readyAlerts === "boolean" ? p.readyAlerts : defaults.readyAlerts,
      promoAlerts: typeof p.promoAlerts === "boolean" ? p.promoAlerts : defaults.promoAlerts,
    };
  } catch { return defaults; }
}

export function savePreferences(email: string, preferences: DemoPreferences): boolean {
  if (!email || typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(accountKey(email, "profile"), JSON.stringify(preferences));
    window.dispatchEvent(new Event(PROFILE_CHANGED));
    return true;
  } catch { return false; }
}

export function readFavorites(email: string): string[] {
  if (!email || typeof window === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(accountKey(email, "favorites")) || "[]");
    if (!Array.isArray(raw)) return [];
    const allIds = new Set(shops.map(s => s.id));
    return [...new Set(raw.filter((id): id is string => typeof id === "string" && allIds.has(id)))];
  } catch { return []; }
}

export function toggleFavorite(email: string, shopId: string): string[] | null {
  if (!email || typeof window === "undefined" || !shops.some(s => s.id === shopId)) return null;
  const favorites = readFavorites(email);
  const updated = favorites.includes(shopId) ? favorites.filter(id => id !== shopId) : [...favorites, shopId];
  try {
    window.localStorage.setItem(accountKey(email, "favorites"), JSON.stringify(updated));
    window.dispatchEvent(new Event(FAVORITES_CHANGED));
    return updated;
  } catch { return null; }
}

export function demoEarnedPoints(order: DemoOrder): number {
  // Fictional rewards rule for frontend previews ONLY: 1 point per ₱25 subtotal.
  // A completed DEMO order does not represent a fulfilled real purchase.
  if (progressFor(order).step !== 3) return 0;
  if (!Number.isFinite(order.subtotal) || order.subtotal < 0) return 0;
  return Math.floor(order.subtotal / 25);
}

export function demoRewardsSummary() {
  const orders = readOrders();
  const completed = orders.filter(o => progressFor(o).step === 3);
  const points = completed.reduce((sum, o) => sum + demoEarnedPoints(o), 0);
  const usedIds = new Set<string>();
  const safeOrders = completed.filter(order => {
    if (usedIds.has(order.id)) return false;
    usedIds.add(order.id);
    return true;
  });
  return { points, completed: safeOrders.length, history: safeOrders };
}

export function displayNameFor(email: string, preferences: DemoPreferences): string {
  const saved = preferences.displayName.trim();
  if (saved) return saved;
  const user = email.split("@")[0] || "Customer";
  return user.replace(/[._-]+/g, " ").replace(/\b[a-z]/g, letter => letter.toUpperCase()).slice(0, 65);
}

export function initialsFor(displayName: string): string {
  return displayName.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0)).join("").toUpperCase() || "SB";
}

export function pickupWindowLabel(window: string) {
  if (window === "No preference") return window;
  const [start, end] = window.split("-");
  const pretty = (s: string) => new Date(`2000-01-01T${s}:00`).toLocaleTimeString("en-PH", {hour:"numeric",minute:"2-digit"});
  return `${pretty(start)} to ${pretty(end)}`;
}
