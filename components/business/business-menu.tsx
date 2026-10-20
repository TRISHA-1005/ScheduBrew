"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3, CalendarClock, Check, ChevronDown, ClipboardList,
  Coffee, Download, Edit3, FileUp, Filter, LayoutDashboard, Menu,
  PackageOpen, Plus, RotateCcw, Search, Settings, ShieldCheck,
  Trash2, UsersRound, X, ArrowUpDown,
} from "lucide-react";
import { Logout } from "@/components/schedu/logout";
import { BusinessShopDetails } from "./business-shop-details";
import { IMAGE_CHOICES, MENU_CATEGORIES, STARTER_MENU,
  exportMenuCSV, formatPeso, importMenuCSV, readOwnerMenu, writeOwnerMenu,
  type MenuCategory, type MenuItem,
} from "./menu-demo-data";
import shell from "./dashboard.module.css";
import styles from "./menu.module.css";

type CategoryFilter = "All" | MenuCategory;
type StatusFilter = "all" | "available" | "unavailable" | "low";
type SortOrder = "name" | "price-asc" | "price-desc" | "stock" | "prep";
const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All availability" }, { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" }, { value: "low", label: "Low stock (10 or less)" },
];
const nav = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/business", batch: 1 },
  { name: "Orders", icon: ClipboardList, href: "/business/orders", batch: 2 },
  { name: "Pickup Schedule", icon: CalendarClock, href: "/business/pickup-schedule", batch: 3 },
  { name: "Menu", icon: Coffee, href: "/business/menu", batch: 4 },
  { name: "Customers", icon: UsersRound, href: "/business/customers", batch: 5 },
  { name: "Analytics", icon: BarChart3, href: "/business/analytics", batch: 6 },
  { name: "Settings", icon: Settings, href: "/business/settings", batch: 8 },
] as const;
const categoryIcons: Record<MenuCategory, string> = {
  "Coffee": "☕", "Milk Tea": "🧋", "Beverages": "🥤", "Shakes": "🍨",
  "Bread & Pastries": "🥐", "Snacks & Meals": "🥪",
};

type EditItem = Omit<MenuItem, "id">;
const newItem = (): EditItem => ({
  name: "", category: "Coffee", description: "", price: 150, stock: 20,
  prepMinutes: 7, available: true, bestseller: false, image: IMAGE_CHOICES[0].path,
});
const initials = (email: string) => (email.split("@")[0] || "SB").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "SB";
const isActuallyAvailable = (item: MenuItem) => item.available && item.stock > 0;

export function BusinessMenu({ email }: { email: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("name");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogId, setDialogId] = useState<string | null>(null);
  const [form, setForm] = useState<EditItem>(newItem);
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const pageSize = 12;

  useEffect(() => {
    const refresh = () => setMenuItems(readOwnerMenu());
    refresh(); setHydrated(true);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    if (!menuOpen && dialogId === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); setDialogId(null); }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen, dialogId]);

  useEffect(() => {
    if (dialogId !== null) firstInput.current?.focus();
  }, [dialogId]);

  const counts = useMemo(() => ({
    total: menuItems.length,
    available: menuItems.filter(isActuallyAvailable).length,
    out: menuItems.filter(item => item.stock === 0).length,
    low: menuItems.filter(item => item.stock > 0 && item.stock <= 10).length,
    bestsellers: menuItems.filter(item => item.bestseller).length,
  }), [menuItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter(item => (category === "All" || item.category === category) &&
      (!q || [item.name, item.description, item.category].some(field => field.toLowerCase().includes(q))) &&
      (status === "all" || (status === "available" && isActuallyAvailable(item)) ||
       (status === "unavailable" && !isActuallyAvailable(item)) ||
       (status === "low" && item.stock <= 10)))
      .sort((a, b) => {
        switch (sortOrder) {
          case "price-asc": return a.price - b.price;
          case "price-desc": return b.price - a.price;
          case "stock": return a.stock - b.stock;
          case "prep": return a.prepMinutes - b.prepMinutes;
          default: return a.name.localeCompare(b.name);
        }
      });
  }, [menuItems, category, search, status, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const changeCategory = (v: CategoryFilter) => { setCategory(v); setPage(1); };
  const changeStatus = (v: StatusFilter) => { setStatus(v); setPage(1); };

  function persist(next: MenuItem[], success: string): boolean {
    if (!writeOwnerMenu(next)) {
      setNotice("Changes could not be saved. Check available browser storage and try again.");
      return false;
    }
    setMenuItems(next);
    setNotice(success);
    return true;
  }
  function toggleAvailable(item: MenuItem) {
    if (!hydrated) return;
    if (!item.available && item.stock === 0) {
      setNotice(`Restock ${item.name} before making it available.`);
      return;
    }
    persist(menuItems.map(i => i.id === item.id ? { ...i, available: !i.available } : i),
      `${item.name} ${item.available ? "hidden from the menu" : "marked available"}.`);
  }
  function toggleBestseller(item: MenuItem) {
    persist(menuItems.map(i => i.id === item.id ? { ...i, bestseller: !i.bestseller } : i),
      `${item.name} ${item.bestseller ? "removed from" : "added to"} featured products.`);
  }
  function beginAdd() {
    setForm(newItem()); setFormError(""); setDialogId("create");
  }
  function beginEdit(item: MenuItem) {
    setForm({ name: item.name, category: item.category, description: item.description,
      price: item.price, stock: item.stock, prepMinutes: item.prepMinutes,
      available: item.available, bestseller: item.bestseller, image: item.image });
    setFormError(""); setDialogId(item.id);
  }
  function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialogId) return;
    const name = form.name.trim();
    if (name.length < 2 || name.length > 80) { setFormError("Enter a product name between 2 and 80 characters."); return; }
    if (form.description.length > 300) { setFormError("Description must not exceed 300 characters."); return; }
    if (!Number.isFinite(form.price) || form.price <= 0 || form.price > 100000 ||
        !Number.isInteger(form.stock) || form.stock < 0 || form.stock > 9999 ||
        !Number.isInteger(form.prepMinutes) || form.prepMinutes < 1 || form.prepMinutes > 240) {
      setFormError("Enter a valid price, stock quantity and preparation time."); return;
    }
    if (form.available && form.stock === 0) { setFormError("Restock the item or turn off availability."); return; }
    if (menuItems.some(item => item.id !== dialogId && item.name.trim().toLowerCase() === name.toLowerCase())) {
      setFormError("An item with this name already exists."); return;
    }
    if (dialogId === "create" && menuItems.length >= 150) { setFormError("Maximum of 150 menu items."); return; }
    const item: MenuItem = { ...form, name, description: form.description.trim(),
      id: dialogId === "create" ? `MENU-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` : dialogId };
    const next = dialogId === "create" ? [...menuItems, item] : menuItems.map(v => v.id === dialogId ? item : v);
    if (persist(next, dialogId === "create" ? `${name} added to the menu.` : `${name} updated.`)) {
      setDialogId(null);
      setFormError("");
    }
  }
  function removeItem(item: MenuItem) {
    if (!window.confirm(`Remove "${item.name}" from the menu? Existing orders will remain unchanged.`)) return;
    persist(menuItems.filter(v => v.id !== item.id), `${item.name} removed from the local menu.`);
  }
  function resetMenu() {
    if (!window.confirm("Reset the menu to its default items? This removes all added or edited menu items.")) return;
    persist(STARTER_MENU.map(i => ({ ...i })), "Restored the default menu items.");
    setSearch(""); setStatus("all"); setCategory("All"); setPage(1);
  }
  function downloadCSV() {
    const csv = exportMenuCSV(menuItems);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "schedubrew-menu.csv";
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2500);
    setNotice("Exported a CSV copy of the current browser menu.");
  }
  async function uploadCSV(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 150_000) {
      setNotice("Choose a .csv file smaller than 150 KB."); return;
    }
    try {
      const raw = await file.text();
      const next = importMenuCSV(raw, menuItems);
      if (!window.confirm(`Import ${Math.max(0, next.length - menuItems.length)} new item(s) and update existing products with matching names? Continue with these changes?`)) return;
      if (persist(next, `Imported CSV successfully. Menu now has ${next.length} items.`)) setPage(1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The CSV file could not be imported.");
    }
  }
  const hasDialog = dialogId !== null;

  return <div className={`${shell.workspace} ${styles.workspace}`}>
    {menuOpen && <button type="button" className={shell.mobileScrim} aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
    <aside className={`${shell.sidebar} ${menuOpen ? shell.sidebarOpen : ""}`} aria-label="Business owner navigation">
      <div className={shell.sideBrand}>
        <Link href="/business" className={shell.brandLink} onClick={() => setMenuOpen(false)}>
          <span className={shell.trcBadge}>TR<span>C</span></span>
          <span><strong>Schedu<span>Brew</span></strong><small>OWNER WORKSPACE</small></span>
        </Link>
        <button type="button" className={shell.closeSide} aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={20}/></button>
      </div>
      <nav className={shell.sideNavigation} aria-label="Business modules">
        {nav.map(({ name, icon: Icon, href, batch }) => (
          <Link key={name} href={href} aria-current={batch === 4 ? "page" : undefined} className={`${shell.sideItem} ${batch === 4 ? shell.sideActive : ""}`} onClick={() => setMenuOpen(false)}><Icon size={18}/><span>{name}</span></Link>
        ))}
      </nav>
      <div className={shell.sideFoot}>
        <div className={shell.sideFootTitle}><ShieldCheck size={17}/> Menu and availability</div>
        <p>Update products, prices, stock and preparation estimates before the next rush.</p>
      </div>
    </aside>

    <div className={shell.mainArea}>
      <header className={shell.topbar}>
        <div className={shell.topLeft}>
          <button type="button" className={shell.mobileMenu} onClick={() => setMenuOpen(true)} aria-label="Open business menu"><Menu size={22}/></button>
          <BusinessShopDetails />
        </div>
        <div className={shell.topRight}>
          <span className={shell.datePill}><CalendarClock size={14}/>{new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(new Date())}</span>
          <div className={shell.avatar} title={email}>{initials(email)}</div>
          <Logout />
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.headingRow}>
          <div><span className={styles.eyebrow}>CATALOG</span><h1>Menu management</h1><p>Manage products, pricing, availability and preparation details.</p></div>
          <div className={styles.headerActions}>
            <input ref={fileInput} className={styles.hiddenInput} type="file" accept=".csv,text/csv" aria-label="Import menu CSV" onChange={uploadCSV}/>
            <button className={styles.secondaryBtn} type="button" disabled={!hydrated} onClick={() => fileInput.current?.click()}><FileUp size={16}/> Import menu</button>
            <button className={styles.primaryBtn} type="button" disabled={!hydrated} onClick={beginAdd}><Plus size={17}/> Add menu item</button>
          </div>
        </div>
        
        {notice && <div className={styles.notice} role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15}/></button></div>}

        <div className={styles.quickStats}>
          <div><span>Total menu items</span><strong>{counts.total}</strong></div>
          <div><span>Available</span><strong>{counts.available}</strong></div>
          <div><span>Low stock</span><strong>{counts.low}</strong></div>
          <div><span>Out of stock</span><strong>{counts.out}</strong></div>
        </div>

        <section className={styles.panel} aria-label="Manage menu items">
          <div className={styles.toolbar}>
            <div className={styles.categories} aria-label="Menu categories">
              {(["All", ...MENU_CATEGORIES] as CategoryFilter[]).map(value => <button type="button" key={value} className={`${styles.categoryPill} ${category === value ? styles.categoryActive : ""}`} aria-pressed={category === value} onClick={() => changeCategory(value)}>{value}</button>)}
            </div>
            <div className={styles.controls}>
              <label className={styles.searchBox}><Search size={16}/><input type="search" placeholder="Search menu items..." aria-label="Search menu items" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></label>
              <label className={styles.selectBox}><Filter size={16}/><select aria-label="Filter menu by availability" value={status} onChange={e => changeStatus(e.target.value as StatusFilter)}>{statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={14}/></label>
              <label className={styles.selectBox}><ArrowUpDown size={16}/><select aria-label="Sort menu items" value={sortOrder} onChange={e => setSortOrder(e.target.value as SortOrder)}><option value="name">Sort: A to Z</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="stock">Stock: Low first</option><option value="prep">Prep: Shortest</option></select><ChevronDown size={14}/></label>
            </div>
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead><tr><th>ITEM</th><th>CATEGORY</th><th>PRICE</th><th>AVAILABILITY</th><th>BESTSELLER</th><th>STOCK STATUS</th><th>PREP TIME</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {!hydrated && <tr><td colSpan={8} className={styles.empty}>Loading menu items...</td></tr>}
                {hydrated && visibleItems.length === 0 && <tr><td colSpan={8} className={styles.empty}><PackageOpen size={29}/><strong>No matching products</strong><span>Try a different search or category, or add a new menu item.</span></td></tr>}
                {visibleItems.map(item => <tr key={item.id}>
                  <td><div className={styles.itemCell}><Image src={item.image} alt="" width={46} height={46} unoptimized className={styles.itemImage}/><span><strong>{item.name}</strong><small>{item.description || "No description"}</small></span></div></td>
                  <td><span className={styles.categoryText}><span aria-hidden="true">{categoryIcons[item.category]}</span>{item.category}</span></td>
                  <td className={styles.price}>{formatPeso(item.price)}</td>
                  <td><label className={styles.toggleRow}><input className={styles.toggleInput} type="checkbox" checked={item.available} onChange={() => toggleAvailable(item)} aria-label={`${item.available ? "Mark" : "Make"} ${item.name} ${item.available ? "unavailable" : "available"}`} /><span className={styles.switch} aria-hidden="true"/><span className={item.available ? styles.availableText : styles.offText}>{isActuallyAvailable(item) ? "Available" : item.stock === 0 ? "Out of stock" : "Unavailable"}</span></label></td>
                  <td><button className={`${styles.bestButton} ${item.bestseller ? styles.bestOn : ""}`} type="button" onClick={() => toggleBestseller(item)} aria-pressed={item.bestseller} title={item.bestseller ? "Remove bestseller" : "Mark bestseller"}>{item.bestseller ? "★ Bestseller" : "☆ Mark"}</button></td>
                  <td><span className={`${styles.stockPill} ${item.stock === 0 ? styles.stockOut : item.stock <= 10 ? styles.stockLow : styles.stockGood}`}>{item.stock === 0 ? "Out of stock" : item.stock <= 10 ? `Low stock (${item.stock})` : `In stock (${item.stock})`}</span></td>
                  <td className={styles.prep}>{item.prepMinutes} min</td>
                  <td><div className={styles.rowActions}><button type="button" title={`Edit ${item.name}`} aria-label={`Edit ${item.name}`} onClick={() => beginEdit(item)}><Edit3 size={15}/></button><button type="button" title={`Remove ${item.name}`} aria-label={`Remove ${item.name}`} onClick={() => removeItem(item)}><Trash2 size={15}/></button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className={styles.panelFooter}>
            <span>{hydrated ? `Showing ${filtered.length ? (currentPage-1)*pageSize+1 : 0} to ${Math.min(currentPage*pageSize,filtered.length)} of ${filtered.length} items` : "Loading items"}</span>
            <div className={styles.footerActions}>
              <button type="button" onClick={downloadCSV} disabled={!hydrated}><Download size={15}/> Export CSV</button>
              <button type="button" onClick={resetMenu} disabled={!hydrated}><RotateCcw size={15}/> Reset menu</button>
              <div className={styles.pages}><button type="button" onClick={() => setPage(p => Math.max(1,p-1))} disabled={currentPage <= 1} aria-label="Previous page">‹</button><span>{currentPage} / {pageCount}</span><button type="button" onClick={() => setPage(p => Math.min(pageCount,p+1))} disabled={currentPage >= pageCount} aria-label="Next page">›</button></div>
            </div>
          </div>
        </section>
      </main>
    </div>

    {hasDialog && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDialogId(null); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="menu-dialog-title">
        <div className={styles.modalHead}><div><span className={styles.eyebrow}>MENU ITEM</span><h2 id="menu-dialog-title">{dialogId === "create" ? "Add menu item" : "Edit menu item"}</h2></div><button type="button" onClick={() => setDialogId(null)} aria-label="Close dialog"><X size={20}/></button></div>
        <form onSubmit={saveItem} className={styles.form}>
          <div className={styles.formGrid}>
            <label className={styles.fullField}>Product name *<input ref={firstInput} type="text" minLength={2} maxLength={80} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Iced Spanish Latte"/></label>
            <label>Category *<select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as MenuCategory }))}>{MENU_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
            <label>Price (PHP) *<input type="number" step="0.01" min="0.01" max="100000" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} required /></label>
            <label>Stock quantity *<input type="number" step="1" min="0" max="9999" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} required /></label>
            <label>Prep time (minutes) *<input type="number" step="1" min="1" max="240" value={form.prepMinutes} onChange={e => setForm(p => ({ ...p, prepMinutes: Number(e.target.value) }))} required /></label>
            <label className={styles.fullField}>Product image<select value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}>{IMAGE_CHOICES.map(choice => <option key={choice.path} value={choice.path}>{choice.label}</option>)}</select></label>
            <div className={styles.imagePreview}><Image src={form.image} width={80} height={65} alt="Selected product preview" unoptimized/></div>
            <label className={styles.fullField}>Description<textarea rows={3} maxLength={300} placeholder="Describe the product" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/></label>
            <label className={styles.checkLine}><input type="checkbox" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))}/>Available on menu</label>
            <label className={styles.checkLine}><input type="checkbox" checked={form.bestseller} onChange={e => setForm(p => ({ ...p, bestseller: e.target.checked }))}/>Mark as bestseller</label>
          </div>
          {formError && <div className={styles.formError} role="alert">{formError}</div>}
          <div className={styles.modalActions}><button type="button" className={styles.secondaryBtn} onClick={() => setDialogId(null)}>Cancel</button><button className={styles.primaryBtn} type="submit"><Check size={17}/> {dialogId === "create" ? "Add item" : "Save changes"}</button></div>
        </form>
      </section>
    </div>}
  </div>;
}
