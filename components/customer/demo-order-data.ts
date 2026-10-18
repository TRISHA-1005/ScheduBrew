/** Temporary browser demo only. No orders, times, or payments are sent to a shop. */
import { products, shops, type Product } from "@/data/schedu-mock";

export type CartLine = { productId: string; quantity: number };
export type DemoCart = { shopId: string; lines: CartLine[] };
export type DemoOrder = {
  id: string;
  shopId: string;
  lines: CartLine[];
  subtotal: number;
  demoServiceFee: number;
  total: number;
  pickupDate: string;
  pickupTime: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  note: string;
  paymentMethod: "counter";
  createdAt: string;
};

export const CART_KEY = "schedu_demo_cart_v1";
export const ORDERS_KEY = "schedu_demo_orders_v1";
export const SAMPLE_SERVICE_FEE = 15;

export const emptyCart = (): DemoCart => ({ shopId: "", lines: [] });

export function readCart(): DemoCart {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = JSON.parse(window.localStorage.getItem(CART_KEY) || "null") as DemoCart | null;
    if (!raw || typeof raw.shopId !== "string" || !shops.some(s => s.id === raw.shopId) || !Array.isArray(raw.lines)) {
      return emptyCart();
    }
    const ids = new Set<string>();
    const lines = raw.lines.filter((line) => {
      if (!line || typeof line.productId !== "string" || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 30) return false;
      if (ids.has(line.productId)) return false;
      if (!products.some(p => p.id === line.productId && p.shopId === raw.shopId)) return false;
      ids.add(line.productId);
      return true;
    });
    return { shopId: raw.shopId, lines };
  } catch {
    return emptyCart();
  }
}

export function saveCart(cart: DemoCart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("schedu-demo-cart-changed"));
}

export function cartDetail(cart: DemoCart) {
  const shop = shops.find(s => s.id === cart.shopId);
  const lines = cart.lines.flatMap(line => {
    const product = products.find(p => p.id === line.productId && p.shopId === cart.shopId);
    return product ? [{ ...product, quantity: line.quantity }] : [];
  });
  const subtotal = lines.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const count = lines.reduce((sum, p) => sum + p.quantity, 0);
  return { shop, lines, subtotal, count };
}

export type CartProduct = Product & { quantity: number };

export function changeCartQuantity(cart: DemoCart, productId: string, delta: number): DemoCart {
  if (!products.some(p => p.id === productId && p.shopId === cart.shopId)) return cart;
  const prior = cart.lines.find(line => line.productId === productId)?.quantity || 0;
  const quantity = Math.max(0, Math.min(30, prior + delta));
  const lines = cart.lines.filter(line => line.productId !== productId);
  if (quantity) lines.push({ productId, quantity });
  return { shopId: cart.shopId, lines };
}

export function readOrders(): DemoOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(ORDERS_KEY) || "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((o): o is DemoOrder => Boolean(o) && typeof o === "object" && typeof o.id === "string") : [];
  } catch {
    return [];
  }
}

export function saveDemoOrder(order: DemoOrder) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readOrders()].slice(0, 30)));
}

/** Local time date, not UTC. Used only for fictional demonstration slots. */
export function dateKey(date: Date) {
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function demoDates() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return { key: dateKey(d), label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" }) };
  });
}

export function formatSlot(value: string) {
  const [hh, mm] = value.split(":").map(Number);
  const d = new Date(2000, 0, 1, hh, mm);
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

export function demoSlots(day: string) {
  const now = new Date();
  const todayKey = dateKey(now);
  const result: string[] = [];
  for (let h = 10; h < 20; h++) {
    for (const m of [0, 20, 40]) {
      if (day === todayKey && (h * 60 + m) < (now.getHours() * 60 + now.getMinutes() + 30)) continue;
      result.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return result;
}
