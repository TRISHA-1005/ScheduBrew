/**
 * ScheduBrew Business Dashboard, Batch 1.
 * Illustrative, browser-only demonstration data. No Supabase shop tables are queried.
 * IMPORTANT: This must never be used to enforce merchant access or order fulfillment.
 */

export type DemoOrderStatus = "queued" | "preparing" | "ready" | "collected" | "cancelled";

export type BusinessDemoOrder = {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  unitPrice: number;
  pickupTime: string;
  status: DemoOrderStatus;
  source: "example" | "walk-in demo";
};

export type DemoPickupSlot = {
  id: string;
  label: string;
  booked: number;
  capacity: number;
};

export const BUSINESS_ORDER_STORAGE = "schedu_business_demo_orders_v1";
export const BUSINESS_STATUS_STORAGE = "schedu_business_demo_statuses_v1";
export const BUSINESS_CAPACITY_STORAGE = "schedu_business_demo_slots_v1";

export const demoProducts = [
  { name: "Spanish Latte", price: 155 },
  { name: "Caramel Macchiato", price: 160 },
  { name: "Cappuccino", price: 145 },
  { name: "Croissant", price: 80 },
  { name: "Glazed Donut", price: 65 },
] as const;

export const sampleOrders: BusinessDemoOrder[] = [
  { id: "EX-0147", customer: "Maria S.", product: "Caramel Macchiato", quantity: 2, unitPrice: 160, pickupTime: "3:20 PM", status: "queued", source: "example" },
  { id: "EX-0148", customer: "Alex R.", product: "Spanish Latte", quantity: 1, unitPrice: 155, pickupTime: "3:25 PM", status: "queued", source: "example" },
  { id: "EX-0149", customer: "Jona K.", product: "Glazed Donut", quantity: 3, unitPrice: 65, pickupTime: "3:30 PM", status: "queued", source: "example" },
  { id: "EX-0142", customer: "Trisha D.", product: "Spanish Latte", quantity: 1, unitPrice: 155, pickupTime: "3:15 PM", status: "preparing", source: "example" },
  { id: "EX-0144", customer: "Ben C.", product: "Cappuccino", quantity: 2, unitPrice: 145, pickupTime: "3:35 PM", status: "preparing", source: "example" },
  { id: "EX-0146", customer: "Liza B.", product: "Croissant", quantity: 2, unitPrice: 80, pickupTime: "3:40 PM", status: "preparing", source: "example" },
  { id: "EX-0138", customer: "Lea M.", product: "Caramel Macchiato", quantity: 1, unitPrice: 160, pickupTime: "3:12 PM", status: "ready", source: "example" },
  { id: "EX-0140", customer: "Carlo T.", product: "Glazed Donut", quantity: 2, unitPrice: 65, pickupTime: "3:15 PM", status: "ready", source: "example" },
];

export const sampleSlots: DemoPickupSlot[] = [
  { id: "s300", label: "3:00", booked: 17, capacity: 20 },
  { id: "s320", label: "3:20", booked: 23, capacity: 25 },
  { id: "s340", label: "3:40", booked: 17, capacity: 25 },
  { id: "s400", label: "4:00", booked: 12, capacity: 25 },
  { id: "s420", label: "4:20", booked: 8, capacity: 25 },
];

export const sampleRevenue = [6900, 7300, 7100, 7950, 7700, 8500, 8250, 8900, 8750];

export const popularItems = [
  { name: "Caramel Macchiato", count: 46 },
  { name: "Iced Spanish Latte", count: 38 },
  { name: "Matcha Cloud", count: 31 },
];

export const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export function safeReadJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function safeWriteJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function isDemoStatus(value: unknown): value is DemoOrderStatus {
  return value === "queued" || value === "preparing" || value === "ready" || value === "collected" || value === "cancelled";
}

export function readExtraOrders(): BusinessDemoOrder[] {
  const raw = safeReadJson(BUSINESS_ORDER_STORAGE);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const v = item as Partial<BusinessDemoOrder>;
    if (typeof v.id !== "string" || !v.id.startsWith("WALK-") ||
        typeof v.customer !== "string" || typeof v.product !== "string" ||
        typeof v.pickupTime !== "string" || !Number.isInteger(v.quantity) ||
        (v.quantity ?? 0) < 1 || (v.quantity ?? 0) > 10 ||
        typeof v.unitPrice !== "number" || !Number.isFinite(v.unitPrice) ||
        !isDemoStatus(v.status)) return [];
    return [{
      id: v.id.slice(0, 48), customer: v.customer.slice(0, 60),
      product: v.product.slice(0, 90), pickupTime: v.pickupTime.slice(0, 25),
      quantity: v.quantity!, unitPrice: v.unitPrice, status: v.status,
      source: "walk-in demo" as const,
    }];
  }).slice(0, 100);
}

export function readDemoStatuses(): Record<string, DemoOrderStatus> {
  const raw = safeReadJson(BUSINESS_STATUS_STORAGE);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const statuses: Record<string, DemoOrderStatus> = {};
  for (const order of sampleOrders) {
    const v = (raw as Record<string, unknown>)[order.id];
    if (isDemoStatus(v)) statuses[order.id] = v;
  }
  return statuses;
}

export function readDemoSlots(): DemoPickupSlot[] {
  const raw = safeReadJson(BUSINESS_CAPACITY_STORAGE);
  if (!Array.isArray(raw)) return sampleSlots;
  return sampleSlots.map((base) => {
    const item = raw.find((v: unknown) => v && typeof v === "object" && "id" in v && v.id === base.id) as Partial<DemoPickupSlot> | undefined;
    return item && Number.isInteger(item.capacity) && item.capacity! >= base.booked && item.capacity! <= 100
      ? { ...base, capacity: item.capacity! }
      : base;
  });
}
