import { readExtraOrders, type BusinessDemoOrder } from "./demo-business-data";
import { manilaDate, type ReportOrder } from "./analytics-report";

export function localReportOrders(orders: BusinessDemoOrder[]) {
  let undated = 0;
  const records: ReportOrder[] = [];
  for (const order of orders) {
    const date = order.createdAt ? manilaDate(order.createdAt) : "";
    if (!date) { undated++; continue; }
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(order.pickupTime.trim());
    const validTime = match && Number(match[1]) >= 1 && Number(match[1]) <= 12 && Number(match[2]) <= 59;
    const hour = validTime ? Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0) : null;
    records.push({ id: order.id, date, product: order.product, quantity: order.quantity, unitPriceCents: Math.round(order.unitPrice * 100), status: order.status, source: "local", pickupHour: hour,
      // Display names are not stable customer identities and must not be used for retention.
      customerId: null });
  }
  return { records, undated };
}
export function readLocalReportOrders() { return localReportOrders(readExtraOrders()); }
