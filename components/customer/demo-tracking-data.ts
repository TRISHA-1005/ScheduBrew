/**
 * BATCH 4: Browser-only order tracking demonstration.
 * Does NOT check a shop, send notifications, verify a pickup, or reserve a slot.
 */
import { ORDERS_KEY, type DemoOrder } from "./demo-order-data";

export const TRACKING_KEY = "schedu_demo_order_progress_v1";
export const TRACKING_CHANGE_EVENT = "schedu-demo-orders-updated";

export const trackingSteps = [
  { key: "confirmed", label: "Confirmed", detail: "Your sample order has been saved in this browser." },
  { key: "preparing", label: "Preparing", detail: "Example update: the kitchen is preparing your items." },
  { key: "ready", label: "Ready for Pickup", detail: "Example update: your demo pickup pass is visible." },
  { key: "collected", label: "Picked Up", detail: "Demo flow finished. No real pickup was performed." },
] as const;

export type DemoStep = 0 | 1 | 2 | 3;
export type TrackingEvent = { step: DemoStep; at: string };
export type DemoProgress = { step: DemoStep; events: TrackingEvent[] };

type ProgressMap = Record<string, DemoProgress>;

function inRange(value: unknown): value is DemoStep {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}

function cleanProgress(value: unknown): DemoProgress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as { step?: unknown; events?: unknown };
  if (!inRange(v.step) || !Array.isArray(v.events)) return null;
  const events: TrackingEvent[] = v.events.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const e = item as { step?: unknown; at?: unknown };
    return inRange(e.step) && typeof e.at === "string" && !Number.isNaN(Date.parse(e.at))
      ? [{ step: e.step, at: e.at }]
      : [];
  }).slice(0, 4);
  return { step: v.step, events };
}

function readProgressMap(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(TRACKING_KEY) || "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const map: ProgressMap = {};
    for (const [id, value] of Object.entries(raw)) {
      if (!/^DEMO-[a-z0-9-]+$/i.test(id)) continue;
      const progress = cleanProgress(value);
      if (progress) map[id] = progress;
    }
    return map;
  } catch {
    return {};
  }
}

export function progressFor(order: DemoOrder): DemoProgress {
  return readProgressMap()[order.id] || {
    step: 0,
    events: [{ step: 0, at: order.createdAt }],
  };
}

export function progressTo(order: DemoOrder, next: DemoStep): DemoProgress {
  const current = progressFor(order);
  if (next < 0 || next > 3 || next === current.step) return current;
  const progress: DemoProgress = next === 0
    ? { step: 0, events: [{ step: 0, at: order.createdAt }] }
    : {
        step: next,
        events: [
          { step: 0, at: order.createdAt },
          ...current.events.filter(e => e.step > 0 && e.step < next),
          { step: next, at: new Date().toISOString() },
        ].slice(0, 4),
      };
  window.localStorage.setItem(TRACKING_KEY, JSON.stringify({ ...readProgressMap(), [order.id]: progress }));
  window.dispatchEvent(new Event(TRACKING_CHANGE_EVENT));
  return progress;
}

export function clearDemoOrders() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORDERS_KEY);
  window.localStorage.removeItem(TRACKING_KEY);
  window.dispatchEvent(new Event(TRACKING_CHANGE_EVENT));
}

export function formattedOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formattedPickupDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (!year || !month || !day || Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
