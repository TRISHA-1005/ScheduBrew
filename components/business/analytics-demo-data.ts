/**
 * ScheduBrew Business Owner Batch 6.
 * Analytics figures are illustrative until the PostgreSQL reporting layer is implemented.
 */
import { readExtraOrders } from "./demo-business-data";

export type AnalyticsPeriod = "Last 7 days" | "Last 30 days" | "Last 90 days" | "This year";
export type TrendView = "Daily" | "Weekly" | "Monthly";

export const ANALYTICS_PERIODS: AnalyticsPeriod[] = ["Last 7 days", "Last 30 days", "Last 90 days", "This year"];
export const TREND_VIEWS: TrendView[] = ["Daily", "Weekly", "Monthly"];

export const BASE_ANALYTICS = {
  grossSales: 286400,
  orders: 2940,
  averageOrderValue: 97.41,
  onTimeRate: 95.6,
  salesGrowth: 12.8,
  orderGrowth: 9.4,
  averageOrderDelta: 4.2,
  customerRetention: 62,
};

export const PERIOD_FACTORS: Record<AnalyticsPeriod, number> = {
  "Last 7 days": 0.24,
  "Last 30 days": 1,
  "Last 90 days": 2.85,
  "This year": 9.4,
};

export const PERIOD_TRENDS: Record<AnalyticsPeriod, { salesGrowth: number; orderGrowth: number; onTimeRate: number; averageOrderDelta: number }> = {
  "Last 7 days": { salesGrowth: 8.2, orderGrowth: 6.7, onTimeRate: 94.8, averageOrderDelta: 2.1 },
  "Last 30 days": { salesGrowth: 12.8, orderGrowth: 9.4, onTimeRate: 95.6, averageOrderDelta: 4.2 },
  "Last 90 days": { salesGrowth: 10.6, orderGrowth: 8.9, onTimeRate: 95.2, averageOrderDelta: 3.6 },
  "This year": { salesGrowth: 14.1, orderGrowth: 11.3, onTimeRate: 95.4, averageOrderDelta: 5.1 },
};

export const TREND_DATA: Record<TrendView, { labels: string[]; revenue: number[]; orders: number[] }> = {
  Daily: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    revenue: [6900, 7300, 7100, 7950, 7700, 8500, 9200],
    orders: [58, 65, 62, 71, 69, 77, 82],
  },
  Weekly: {
    labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7"],
    revenue: [22100, 24600, 23800, 26900, 26400, 29100, 31500],
    orders: [220, 246, 239, 267, 263, 288, 312],
  },
  Monthly: {
    labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    revenue: [185000, 197000, 213000, 228000, 254000, 286400],
    orders: [1900, 2020, 2150, 2290, 2570, 2940],
  },
};

export const TOP_PRODUCTS = [
  { name: "Caramel Macchiato", units: 462, revenue: 73920, trend: 18 },
  { name: "Iced Spanish Latte", units: 388, revenue: 58200, trend: 11 },
  { name: "Matcha Cloud", units: 307, revenue: 47585, trend: 6 },
];

export const PICKUP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const PICKUP_PERIODS = ["11 AM", "1 PM", "3 PM", "5 PM", "7 PM"] as const;
export const PICKUP_HEATMAP = [
  [1, 2, 3, 5, 2, 1],
  [2, 4, 5, 2, 2, 4],
  [4, 3, 5, 1, 2, 5],
  [5, 1, 2, 4, 5, 1],
  [2, 4, 3, 5, 1, 2],
] as const;

export function readLocalOrderActivity() {
  const orders = readExtraOrders().filter(order => order.status !== "cancelled");
  return {
    count: orders.length,
    revenue: orders.reduce((sum, order) => sum + order.quantity * order.unitPrice, 0),
  };
}

export function peso(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
