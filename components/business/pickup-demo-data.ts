import {
  type BusinessDemoOrder, type DemoPickupSlot,
  readDemoSlots, readDemoStatuses, readExtraOrders, sampleOrders,
  safeReadJson, safeWriteJson,
} from "./demo-business-data";

export const PICKUP_RULES_STORAGE = "schedu_business_pickup_rules_v1";
export const PICKUP_BLOCKS_STORAGE = "schedu_business_pickup_blocks_v1";
export const PICKUP_CHANGED_EVENT = "schedu_business_pickup_changed";

export type PickupRules = { maxPerSlot: number; bufferMinutes: number };
export type PickupBlocks = Record<string, string>;
export const DEFAULT_RULES: PickupRules = { maxPerSlot: 25, bufferMinutes: 5 };
export const TIME_LABELS = ["2:40 PM", "3:00 PM", "3:20 PM", "3:40 PM", "4:00 PM", "4:20 PM", "4:40 PM", "5:00 PM"] as const;
const SLOT_IDS: Record<string, string> = {
  "3:00 PM": "s300", "3:20 PM": "s320", "3:40 PM": "s340", "4:00 PM": "s400", "4:20 PM": "s420",
};

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function localDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) || dateKey(date) !== iso ? new Date() : date;
}
export function addDays(iso: string, days: number): string {
  const date = localDate(iso);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
export function readableDate(iso: string, weekday = true): string {
  return localDate(iso).toLocaleDateString("en-PH", { weekday: weekday ? "long" : undefined, month: "short", day: "numeric", year: "numeric" });
}
export function weekStart(iso: string): string {
  const date = localDate(iso);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dateKey(date);
}
export function slotStorageKey(day: string, time: string): string { return `${day}|${time}`; }
export function formatTime(raw: string): string {
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  return `${Number(match[1])}:${match[2]} ${match[3].toUpperCase()}`;
}
export function timeToMinutes(raw: string): number {
  const match = formatTime(raw).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return NaN;
  let hour = Number(match[1]) % 12;
  if (match[3] === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}
export function roundToSlot(raw: string): string {
  const minutes = timeToMinutes(raw);
  if (!Number.isFinite(minutes)) return "";
  const sorted = [...TIME_LABELS].map(label => ({ label, minutes: timeToMinutes(label) }));
  for (let i = 0; i < sorted.length; i++) {
    if (minutes >= sorted[i].minutes && minutes < sorted[i].minutes + 20) return sorted[i].label;
  }
  return "";
}
export function readPickupRules(): PickupRules {
  const raw = safeReadJson(PICKUP_RULES_STORAGE);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_RULES;
  const p = raw as Partial<PickupRules>;
  return {
    maxPerSlot: Number.isInteger(p.maxPerSlot) && p.maxPerSlot! >= 1 && p.maxPerSlot! <= 100 ? p.maxPerSlot! : DEFAULT_RULES.maxPerSlot,
    bufferMinutes: [0, 5, 10, 15].includes(p.bufferMinutes ?? -1) ? p.bufferMinutes! : DEFAULT_RULES.bufferMinutes,
  };
}
export function readPickupBlocks(): PickupBlocks {
  const raw = safeReadJson(PICKUP_BLOCKS_STORAGE);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const valid: PickupBlocks = {};
  for (const [key, reason] of Object.entries(raw as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}\|\d{1,2}:\d{2} (AM|PM)$/.test(key) && typeof reason === "string") valid[key] = reason.slice(0, 80);
  }
  return valid;
}
export function savePickupRules(value: PickupRules): void { safeWriteJson(PICKUP_RULES_STORAGE, value); window.dispatchEvent(new Event(PICKUP_CHANGED_EVENT)); }
export function savePickupBlocks(value: PickupBlocks): void { safeWriteJson(PICKUP_BLOCKS_STORAGE, value); window.dispatchEvent(new Event(PICKUP_CHANGED_EVENT)); }
export function readAllOwnerOrders(): BusinessDemoOrder[] {
  const statuses = readDemoStatuses();
  return [
    ...readExtraOrders(),
    ...sampleOrders.map(order => ({ ...order, status: statuses[order.id] ?? order.status })),
  ];
}

export type SlotSummary = {
  label: string;
  id: string | null;
  baselineBooked: number;
  walkInBooked: number;
  booked: number;
  capacity: number;
  remaining: number;
  orderCards: BusinessDemoOrder[];
  blockedReason: string | null;
};
export function buildSchedule(day: string, today: string, allOrders: BusinessDemoOrder[], capacities: DemoPickupSlot[], blocks: PickupBlocks, rules: PickupRules): SlotSummary[] {
  const isToday = day === today;
  return TIME_LABELS.map(label => {
    const existingId = SLOT_IDS[label] ?? null;
    const original = isToday ? capacities.find(slot => slot.id === existingId) : undefined;
    const orderCards = isToday ? allOrders.filter(order => order.status !== "cancelled" && roundToSlot(order.pickupTime) === label) : [];
    const walkInBooked = orderCards.filter(order => order.source === "walk-in demo").length;
    // Existing baseline represents sample bookings, including the example order cards, so only extra walk-ins are added.
    const baselineBooked = original?.booked ?? (isToday ? orderCards.filter(order => order.source === "example").length : 0);
    const capacity = original?.capacity ?? rules.maxPerSlot;
    const booked = baselineBooked + walkInBooked;
    return {
      label, id: existingId, baselineBooked, walkInBooked, booked, capacity,
      remaining: Math.max(0, capacity - booked), orderCards,
      blockedReason: blocks[slotStorageKey(day, label)] ?? null,
    };
  });
}
export function readCurrentCapacities(): DemoPickupSlot[] { return readDemoSlots(); }
