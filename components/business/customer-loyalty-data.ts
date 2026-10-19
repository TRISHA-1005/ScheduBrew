/**
 * ScheduBrew Business Owner Batch 5.
 * Customer and loyalty records are illustrative and stored in this browser only.
 * The database phase must replace this with merchant and branch scoped PostgreSQL queries.
 */
import { safeReadJson, safeWriteJson } from "./demo-business-data";

export const OWNER_CUSTOMER_STORAGE = "schedu_business_customers_demo_v1";
export const OWNER_REWARD_STORAGE = "schedu_business_rewards_demo_v1";
export const OWNER_LOYALTY_METRICS_STORAGE = "schedu_business_loyalty_metrics_demo_v1";

export type LoyaltyTier = "Gold" | "Silver" | "Bronze";

export type DemoCustomer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  points: number;
  lastVisit: string;
  favoriteItem: string;
  joined: string;
};

export type LoyaltyReward = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  active: boolean;
  redemptions: number;
};

export type LoyaltyMetrics = {
  pointsIssuedThisMonth: number;
  rewardsRedeemed: number;
};

export function tierForPoints(points: number): LoyaltyTier {
  if (points >= 700) return "Gold";
  if (points >= 400) return "Silver";
  return "Bronze";
}

export const STARTER_CUSTOMERS: DemoCustomer[] = [
  { id: "CUS-1001", name: "Maria Santos", email: "maria.santos@example.com", orders: 12, spent: 3600, points: 820, lastVisit: "Today, 10:42 AM", favoriteItem: "Spanish Latte", joined: "Jan 12, 2026" },
  { id: "CUS-1002", name: "Juan Dela Cruz", email: "juan.delacruz@example.com", orders: 9, spent: 2700, points: 610, lastVisit: "Yesterday, 4:15 PM", favoriteItem: "Brown Sugar Milk Tea", joined: "Feb 03, 2026" },
  { id: "CUS-1003", name: "Roberto Garcia", email: "roberto.garcia@example.com", orders: 7, spent: 2100, points: 480, lastVisit: "Oct 16, 2026", favoriteItem: "Cappuccino", joined: "Mar 22, 2026" },
  { id: "CUS-1004", name: "Ana Reyes", email: "ana.reyes@example.com", orders: 6, spent: 1800, points: 350, lastVisit: "Oct 14, 2026", favoriteItem: "Matcha Latte", joined: "Apr 08, 2026" },
  { id: "CUS-1005", name: "Jenny Lim", email: "jenny.lim@example.com", orders: 5, spent: 1500, points: 290, lastVisit: "Oct 11, 2026", favoriteItem: "Croissant", joined: "May 19, 2026" },
];

export const STARTER_REWARDS: LoyaltyReward[] = [
  { id: "RWD-001", name: "Free regular coffee", description: "One regular brewed coffee or americano.", pointsRequired: 120, active: true, redemptions: 96 },
  { id: "RWD-002", name: "Free pastry", description: "Choose one eligible pastry from the menu.", pointsRequired: 90, active: true, redemptions: 74 },
  { id: "RWD-003", name: "₱50 off next order", description: "A ₱50 discount on an eligible order.", pointsRequired: 250, active: true, redemptions: 68 },
  { id: "RWD-004", name: "Free milk tea", description: "One regular milk tea from the sample menu.", pointsRequired: 180, active: false, redemptions: 46 },
];

export const STARTER_LOYALTY_METRICS: LoyaltyMetrics = {
  pointsIssuedThisMonth: 18420,
  rewardsRedeemed: 284,
};

function isCustomer(value: unknown): value is DemoCustomer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Partial<DemoCustomer>;
  return typeof v.id === "string" && v.id.length <= 60 &&
    typeof v.name === "string" && v.name.trim().length >= 2 && v.name.length <= 100 &&
    typeof v.email === "string" && v.email.length <= 180 &&
    Number.isInteger(v.orders) && (v.orders ?? -1) >= 0 &&
    typeof v.spent === "number" && Number.isFinite(v.spent) && v.spent >= 0 &&
    Number.isInteger(v.points) && (v.points ?? -1) >= 0 && (v.points ?? 0) <= 1000000 &&
    typeof v.lastVisit === "string" && v.lastVisit.length <= 80 &&
    typeof v.favoriteItem === "string" && v.favoriteItem.length <= 100 &&
    typeof v.joined === "string" && v.joined.length <= 60;
}

function isReward(value: unknown): value is LoyaltyReward {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Partial<LoyaltyReward>;
  return typeof v.id === "string" && v.id.length <= 60 &&
    typeof v.name === "string" && v.name.trim().length >= 2 && v.name.length <= 100 &&
    typeof v.description === "string" && v.description.length <= 240 &&
    Number.isInteger(v.pointsRequired) && (v.pointsRequired ?? 0) >= 1 && (v.pointsRequired ?? 0) <= 100000 &&
    typeof v.active === "boolean" && Number.isInteger(v.redemptions) && (v.redemptions ?? -1) >= 0;
}

export function readOwnerCustomers(): DemoCustomer[] {
  const raw = safeReadJson(OWNER_CUSTOMER_STORAGE);
  if (!Array.isArray(raw)) return STARTER_CUSTOMERS.map(customer => ({ ...customer }));
  const seen = new Set<string>();
  return raw.slice(0, 500).filter(isCustomer).filter(customer => {
    if (seen.has(customer.id)) return false;
    seen.add(customer.id);
    return true;
  }).map(customer => ({ ...customer }));
}

export function writeOwnerCustomers(customers: DemoCustomer[]): boolean {
  return customers.length <= 500 && customers.every(isCustomer) && safeWriteJson(OWNER_CUSTOMER_STORAGE, customers);
}

export function readOwnerRewards(): LoyaltyReward[] {
  const raw = safeReadJson(OWNER_REWARD_STORAGE);
  if (!Array.isArray(raw)) return STARTER_REWARDS.map(reward => ({ ...reward }));
  const seen = new Set<string>();
  return raw.slice(0, 100).filter(isReward).filter(reward => {
    if (seen.has(reward.id)) return false;
    seen.add(reward.id);
    return true;
  }).map(reward => ({ ...reward }));
}

export function writeOwnerRewards(rewards: LoyaltyReward[]): boolean {
  return rewards.length <= 100 && rewards.every(isReward) && safeWriteJson(OWNER_REWARD_STORAGE, rewards);
}

export function readLoyaltyMetrics(): LoyaltyMetrics {
  const raw = safeReadJson(OWNER_LOYALTY_METRICS_STORAGE);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...STARTER_LOYALTY_METRICS };
  const value = raw as Partial<LoyaltyMetrics>;
  return {
    pointsIssuedThisMonth: Number.isInteger(value.pointsIssuedThisMonth) && (value.pointsIssuedThisMonth ?? -1) >= 0
      ? value.pointsIssuedThisMonth! : STARTER_LOYALTY_METRICS.pointsIssuedThisMonth,
    rewardsRedeemed: Number.isInteger(value.rewardsRedeemed) && (value.rewardsRedeemed ?? -1) >= 0
      ? value.rewardsRedeemed! : STARTER_LOYALTY_METRICS.rewardsRedeemed,
  };
}

export function writeLoyaltyMetrics(metrics: LoyaltyMetrics): boolean {
  return Number.isInteger(metrics.pointsIssuedThisMonth) && metrics.pointsIssuedThisMonth >= 0 &&
    Number.isInteger(metrics.rewardsRedeemed) && metrics.rewardsRedeemed >= 0 &&
    safeWriteJson(OWNER_LOYALTY_METRICS_STORAGE, metrics);
}

export function formatPoints(value: number): string {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);
}
