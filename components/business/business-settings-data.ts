import { safeReadJson, safeWriteJson } from "./demo-business-data";

export const BUSINESS_SETTINGS_STORAGE = "schedu_business_settings_v1";

export const BUSINESS_DAY_KEYS = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

export const BUSINESS_DAY_LABELS: Record<BusinessDayKey, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export type BusinessDayKey = typeof BUSINESS_DAY_KEYS[number];
export type OperatingDay = { closed: boolean; open: string; close: string };
export type BusinessProfile = {
  businessName: string;
  branchName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  description: string;
};
export type BusinessNotifications = {
  orderUpdates: boolean;
  pickupReminders: boolean;
  lowCapacityAlerts: boolean;
  loyaltyActivity: boolean;
  weeklySummary: boolean;
};
export type SubscriptionPlan = "Starter" | "Growth" | "Pro";
export type BusinessSettings = {
  profile: BusinessProfile;
  operatingHours: Record<BusinessDayKey, OperatingDay>;
  notifications: BusinessNotifications;
  subscription: { plan: SubscriptionPlan; updatedAt: string | null };
};

const standardDay: OperatingDay = { closed: false, open: "07:00", close: "20:00" };

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  profile: {
    businessName: "Brewed Awakenings",
    branchName: "Main Branch",
    email: "hello@example.com",
    phone: "+63 917 555 0134",
    address: "123 Coffee Lane",
    city: "Pasig City",
    province: "Metro Manila",
    postalCode: "1600",
    description: "A neighborhood coffee and pastry shop.",
  },
  operatingHours: {
    sunday: { closed: false, open: "08:00", close: "18:00" },
    monday: { ...standardDay },
    tuesday: { ...standardDay },
    wednesday: { ...standardDay },
    thursday: { ...standardDay },
    friday: { ...standardDay },
    saturday: { closed: false, open: "08:00", close: "18:00" },
  },
  notifications: {
    orderUpdates: true,
    pickupReminders: true,
    lowCapacityAlerts: true,
    loyaltyActivity: true,
    weeklySummary: false,
  },
  subscription: { plan: "Starter", updatedAt: null },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

function cleanString(value: unknown, fallback: string, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

function readDay(value: unknown, fallback: OperatingDay): OperatingDay {
  if (!isRecord(value)) return { ...fallback };
  return {
    closed: typeof value.closed === "boolean" ? value.closed : fallback.closed,
    open: isTime(value.open) ? value.open : fallback.open,
    close: isTime(value.close) ? value.close : fallback.close,
  };
}

export function normalizeBusinessSettings(value: unknown): BusinessSettings {
  const source = isRecord(value) ? value : {};
  const rawProfile = isRecord(source.profile) ? source.profile : {};
  const rawHours = isRecord(source.operatingHours) ? source.operatingHours : {};
  const rawNotifications = isRecord(source.notifications) ? source.notifications : {};
  const rawSubscription = isRecord(source.subscription) ? source.subscription : {};

  const profile: BusinessProfile = {
    businessName: cleanString(rawProfile.businessName, DEFAULT_BUSINESS_SETTINGS.profile.businessName, 80) || DEFAULT_BUSINESS_SETTINGS.profile.businessName,
    branchName: cleanString(rawProfile.branchName, DEFAULT_BUSINESS_SETTINGS.profile.branchName, 60) || DEFAULT_BUSINESS_SETTINGS.profile.branchName,
    email: cleanString(rawProfile.email, DEFAULT_BUSINESS_SETTINGS.profile.email, 120),
    phone: cleanString(rawProfile.phone, DEFAULT_BUSINESS_SETTINGS.profile.phone, 32),
    address: cleanString(rawProfile.address, DEFAULT_BUSINESS_SETTINGS.profile.address, 120),
    city: cleanString(rawProfile.city, DEFAULT_BUSINESS_SETTINGS.profile.city, 60) || DEFAULT_BUSINESS_SETTINGS.profile.city,
    province: cleanString(rawProfile.province, DEFAULT_BUSINESS_SETTINGS.profile.province, 60),
    postalCode: cleanString(rawProfile.postalCode, DEFAULT_BUSINESS_SETTINGS.profile.postalCode, 16),
    description: cleanString(rawProfile.description, DEFAULT_BUSINESS_SETTINGS.profile.description, 180),
  };

  const operatingHours = {} as Record<BusinessDayKey, OperatingDay>;
  for (const key of BUSINESS_DAY_KEYS) {
    operatingHours[key] = readDay(rawHours[key], DEFAULT_BUSINESS_SETTINGS.operatingHours[key]);
  }

  const notifications: BusinessNotifications = {
    orderUpdates: typeof rawNotifications.orderUpdates === "boolean" ? rawNotifications.orderUpdates : true,
    pickupReminders: typeof rawNotifications.pickupReminders === "boolean" ? rawNotifications.pickupReminders : true,
    lowCapacityAlerts: typeof rawNotifications.lowCapacityAlerts === "boolean" ? rawNotifications.lowCapacityAlerts : true,
    loyaltyActivity: typeof rawNotifications.loyaltyActivity === "boolean" ? rawNotifications.loyaltyActivity : true,
    weeklySummary: typeof rawNotifications.weeklySummary === "boolean" ? rawNotifications.weeklySummary : false,
  };

  const plan = rawSubscription.plan === "Growth" || rawSubscription.plan === "Pro" ? rawSubscription.plan : "Starter";
  const updatedAt = typeof rawSubscription.updatedAt === "string" && Number.isFinite(Date.parse(rawSubscription.updatedAt))
    ? new Date(rawSubscription.updatedAt).toISOString()
    : null;

  return { profile, operatingHours, notifications, subscription: { plan, updatedAt } };
}

export function readBusinessSettings(): BusinessSettings {
  return normalizeBusinessSettings(safeReadJson(BUSINESS_SETTINGS_STORAGE));
}

export function writeBusinessSettings(value: BusinessSettings): boolean {
  return safeWriteJson(BUSINESS_SETTINGS_STORAGE, normalizeBusinessSettings(value));
}

export function businessDayKey(dateKey: string): BusinessDayKey {
  const date = new Date(`${dateKey}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return "monday";
  return BUSINESS_DAY_KEYS[date.getDay()];
}

export function getBusinessHoursForDate(
  dateKey: string,
  hours: Record<BusinessDayKey, OperatingDay>,
): OperatingDay {
  return hours[businessDayKey(dateKey)] ?? { ...standardDay };
}

function toMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function parseSlotMinutes(label: string, open: string, close: string): number | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "AM") hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
    return hour * 60 + minute;
  }

  if (hour > 12) return hour * 60 + minute;
  const twelveHour = hour % 12;
  const candidates = [twelveHour * 60 + minute, (twelveHour + 12) * 60 + minute];
  const opening = toMinutes(open);
  const closing = toMinutes(close);
  return candidates.find(candidate => candidate >= opening && candidate < closing) ?? candidates[0];
}

export function isPickupSlotWithinHours(
  dateKey: string,
  label: string,
  hours: Record<BusinessDayKey, OperatingDay>,
): boolean {
  const day = getBusinessHoursForDate(dateKey, hours);
  if (day.closed || !isTime(day.open) || !isTime(day.close) || toMinutes(day.close) <= toMinutes(day.open)) return false;
  const slot = parseSlotMinutes(label, day.open, day.close);
  return slot !== null && slot >= toMinutes(day.open) && slot < toMinutes(day.close);
}
