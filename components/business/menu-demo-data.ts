/**
 * ScheduBrew Business Owner Batch 4.
 * Menu data is browser-only; this is NOT a merchant-authorized inventory service.
 * The future PostgreSQL version must scope rows to a verified merchant and branch.
 */
import { safeReadJson, safeWriteJson } from "./demo-business-data";

export const OWNER_MENU_STORAGE = "schedu_business_demo_menu_v1";
export type MenuCategory = "Coffee" | "Milk Tea" | "Beverages" | "Shakes" | "Bread & Pastries" | "Snacks & Meals";
export const MENU_CATEGORIES: MenuCategory[] = ["Coffee", "Milk Tea", "Beverages", "Shakes", "Bread & Pastries", "Snacks & Meals"];
export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  price: number;
  stock: number;
  prepMinutes: number;
  available: boolean;
  bestseller: boolean;
  image: string;
};

export const IMAGE_CHOICES: { label: string; path: string }[] = [
  { label: "Spanish Latte", path: "/schedu/discovery/product-spanish-latte.jpg" },
  { label: "Cappuccino", path: "/schedu/discovery/product-cappuccino.jpg" },
  { label: "Caramel Macchiato", path: "/schedu/discovery/product-caramel-macchiato.jpg" },
  { label: "Brown Sugar Milk Tea", path: "/schedu/discovery/product-brown-sugar-milk-tea.jpg" },
  { label: "Wintermelon Milk Tea", path: "/schedu/discovery/product-wintermelon-milk-tea.jpg" },
  { label: "Matcha Latte", path: "/schedu/discovery/product-matcha-latte.jpg" },
  { label: "Lemon Tea", path: "/schedu/discovery/product-lemon-tea.jpg" },
  { label: "Chocolate Banana Shake", path: "/schedu/discovery/product-chocolate-banana-shake.jpg" },
  { label: "Glazed Donut", path: "/schedu/discovery/product-glazed-donut.jpg" },
  { label: "Croissant", path: "/schedu/discovery/product-croissant.jpg" },
  { label: "Ensaymada", path: "/schedu/discovery/product-ensaymada.jpg" },
  { label: "Ham and Cheese Sandwich", path: "/schedu/discovery/product-ham-cheese-sandwich.jpg" },
  { label: "Creamy Carbonara", path: "/schedu/discovery/product-creamy-carbonara.jpg" },
  { label: "French Fries", path: "/schedu/discovery/product-french-fries.jpg" },
];

const imageFor = (label: string) => IMAGE_CHOICES.find(i => i.label === label)?.path ?? IMAGE_CHOICES[0].path;
const starter: Array<[string, MenuCategory, number, number, number, boolean, string]> = [
  ["Spanish Latte", "Coffee", 150, 25, 7, true, "Espresso with creamy milk and subtle sweetness."],
  ["Cappuccino", "Coffee", 140, 30, 6, true, "Espresso and silky steamed milk."],
  ["Brown Sugar Milk Tea", "Milk Tea", 120, 40, 8, true, "Milk tea with brown sugar syrup and pearls."],
  ["Matcha Latte", "Milk Tea", 125, 35, 8, false, "Creamy green tea latte."],
  ["Lemon Tea", "Beverages", 95, 50, 5, false, "Refreshing citrus tea over ice."],
  ["Chocolate Banana Shake", "Shakes", 150, 8, 10, true, "A rich chocolate and banana shake."],
  ["Glazed Donut", "Bread & Pastries", 45, 60, 2, false, "Soft glazed donut."],
  ["Croissant", "Bread & Pastries", 65, 30, 3, false, "Buttery, flaky pastry."],
  ["Ensaymada", "Bread & Pastries", 55, 25, 3, false, "Soft pastry with butter and cheese."],
  ["Ham and Cheese Sandwich", "Snacks & Meals", 135, 20, 7, true, "Toasted ham and cheese sandwich."],
  ["Creamy Carbonara", "Snacks & Meals", 160, 5, 12, false, "Creamy pasta with savory toppings."],
  ["French Fries", "Snacks & Meals", 80, 50, 4, false, "Golden fries, lightly salted."],
];
export const STARTER_MENU: MenuItem[] = starter.map(([name, category, price, stock, prepMinutes, bestseller, description], index) => ({
  id: `SB-P${String(index + 1).padStart(3, "0")}`,
  name, category, price, stock, prepMinutes, bestseller, description, available: true,
  image: imageFor(name === "Matcha Latte" ? "Matcha Latte" : name),
}));

function isMenuItem(value: unknown): value is MenuItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Partial<MenuItem>;
  return typeof v.id === "string" && v.id.length < 70 &&
    typeof v.name === "string" && v.name.trim().length >= 2 && v.name.length <= 80 &&
    MENU_CATEGORIES.includes(v.category as MenuCategory) &&
    typeof v.description === "string" && v.description.length <= 300 &&
    typeof v.price === "number" && Number.isFinite(v.price) && v.price > 0 && v.price <= 100000 &&
    typeof v.stock === "number" && Number.isInteger(v.stock) && v.stock >= 0 && v.stock <= 9999 &&
    typeof v.prepMinutes === "number" && Number.isInteger(v.prepMinutes) && v.prepMinutes >= 1 && v.prepMinutes <= 240 &&
    typeof v.available === "boolean" && typeof v.bestseller === "boolean" &&
    typeof v.image === "string" && IMAGE_CHOICES.some(choice => choice.path === v.image);
}

export function readOwnerMenu(): MenuItem[] {
  const saved = safeReadJson(OWNER_MENU_STORAGE);
  if (!Array.isArray(saved)) return STARTER_MENU.map(i => ({ ...i }));
  const found = new Set<string>();
  return saved.slice(0, 150).filter(isMenuItem).filter(item => {
    if (found.has(item.id)) return false;
    found.add(item.id);
    return true;
  }).map(item => ({ ...item }));
}

export function writeOwnerMenu(items: MenuItem[]): boolean {
  return items.length <= 150 && items.every(isMenuItem) && safeWriteJson(OWNER_MENU_STORAGE, items);
}

export function formatPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** Quote CSV values correctly (including commas, quotes and line breaks). */
const csvCell = (value: string | number | boolean): string => `"${String(value).replace(/"/g, '""')}"`;
export const MENU_CSV_HEADERS = ["name", "category", "price", "stock", "prepMinutes", "available", "bestseller", "description", "image"] as const;
export function exportMenuCSV(items: MenuItem[]): string {
  const lines = [MENU_CSV_HEADERS.join(",")];
  for (const i of items) {
    const values = [i.name, i.category, i.price, i.stock, i.prepMinutes, i.available, i.bestseller, i.description, i.image];
    lines.push(values.map(csvCell).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

/** RFC-style quoted CSV fields, including escaped quotes and line breaks. */
export function parseCSV(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else value += c;
    } else if (c === '"') {
      if (value.length || closed) throw new Error("Unexpected quote in CSV.");
      quoted = true;
    } else if (c === "," || c === "\n" || c === "\r") {
      row.push(value); value = ""; closed = false;
      if (c !== ",") {
        if (row.some(v => v.trim())) rows.push(row);
        row = [];
        if (c === "\r" && text[i + 1] === "\n") i++;
      }
    } else {
      if (closed && c !== " " && c !== "\t") throw new Error("Unexpected text after CSV quote.");
      value += c;
    }
  }
  if (quoted) throw new Error("Unclosed quoted CSV field.");
  row.push(value);
  if (row.some(v => v.trim())) rows.push(row);
  return rows;
}

export function importMenuCSV(raw: string, current: MenuItem[]): MenuItem[] {
  const lines = parseCSV(raw);
  if (lines.length < 2) throw new Error("CSV must include a header and at least one product.");
  if (lines.length > 151) throw new Error("Import a maximum of 150 products at once.");
  const headers = lines[0].map(v => v.trim());
  if (MENU_CSV_HEADERS.some(h => !headers.includes(h))) throw new Error(`Required CSV columns: ${MENU_CSV_HEADERS.join(", ")}`);
  const results = current.map(item => ({ ...item }));
  const keys = new Map(results.map((item, index) => [item.name.trim().toLowerCase(), index]));
  for (const [idx, cells] of lines.slice(1).entries()) {
    const get = (name: string) => (cells[headers.indexOf(name)] ?? "").trim();
    const n = idx + 2, name = get("name"), category = get("category") as MenuCategory;
    const price = Number(get("price"));
    const stock = Number(get("stock")), prepMinutes = Number(get("prepMinutes"));
    const available = get("available").toLowerCase(), bestseller = get("bestseller").toLowerCase();
    const description = get("description"), image = get("image");
    if (cells.length !== headers.length || name.length < 2 || name.length > 80 ||
        !MENU_CATEGORIES.includes(category) || !Number.isFinite(price) || price <= 0 || price > 100000 ||
        !Number.isInteger(stock) || stock < 0 || stock > 9999 ||
        !Number.isInteger(prepMinutes) || prepMinutes < 1 || prepMinutes > 240 ||
        !["true", "false"].includes(available) || !["true", "false"].includes(bestseller) ||
        description.length > 300 || !IMAGE_CHOICES.some(choice => choice.path === image)) {
      throw new Error(`Invalid product data at CSV row ${n}. No items were changed.`);
    }
    const key = name.toLowerCase();
    const existingIdx = keys.get(key);
    const next: MenuItem = { id: existingIdx === undefined ? `MENU-${Date.now()}-${idx}` : results[existingIdx].id,
      name, category, price, stock, prepMinutes, available: available === "true", bestseller: bestseller === "true", description, image };
    if (existingIdx === undefined) { keys.set(key, results.length); results.push(next); }
    else results[existingIdx] = next;
    if (results.length > 150) throw new Error("Menu limit is 150 products in this frontend demonstration.");
  }
  return results;
}
