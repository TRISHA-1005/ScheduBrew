"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, Search, SlidersHorizontal, Star, ArrowRight, ShoppingBag, Heart } from "lucide-react";
import { categories, products, shops, type CategoryId } from "@/data/schedu-mock";
import { CustomerNav } from "./customer-nav";
import { FAVORITES_CHANGED, readFavorites, toggleFavorite as updateFavorite } from "./demo-profile-data";
import s from "./customer.module.css";

type Order = 'recommended' | 'fastest' | 'top-rated';
const validCategories = categories.map(c => c.id);

export function CustomerDiscover({email, initialCategory}:{email:string;initialCategory:string}) {
  const [category,setCategory] = useState<CategoryId>(validCategories.includes(initialCategory as CategoryId)?initialCategory as CategoryId:'all');
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState<Order>('recommended');
  const [quickPickup,setQuickPickup] = useState(false);
  const [showFilters,setShowFilters] = useState(false);
  const [favorites,setFavorites] = useState<string[]>([]);
  const [searchInput,setSearchInput] = useState('');
  useEffect(() => {
    const refresh = () => setFavorites(readFavorites(email));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(FAVORITES_CHANGED, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(FAVORITES_CHANGED, refresh);
    };
  }, [email]);

  const filteredShops = useMemo(()=>{
    const q=query.trim().toLowerCase();
    const list=shops.filter(shop=>{
      const matchesCategory = category==='all'||shop.categories.includes(category);
      const matchesText = !q || [shop.name,shop.types,shop.location,shop.description].join(' ').toLowerCase().includes(q)
        || products.some(p=>p.shopId===shop.id&&p.name.toLowerCase().includes(q));
      return matchesCategory&&matchesText&&(!quickPickup||shop.prepMinutes<=12);
    });
    return [...list].sort((a,b)=>sort==='fastest'?a.prepMinutes-b.prepMinutes:sort==='top-rated'?b.rating-a.rating:0);
  },[category,query,sort,quickPickup]);

  const filteredProducts=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return products.filter(p=>(category==='all'||p.category===category)&&(!q||[p.name,p.description].join(' ').toLowerCase().includes(q))).slice(0,18);
  },[category,query]);
  const chooseCategory=(id:CategoryId)=>{setCategory(id);window.history.replaceState(null,'',id==='all'?'/customer#browse':`/customer?category=${id}#browse`);};
  const toggleFavorite=(id:string)=>{const next=updateFavorite(email,id);if(next)setFavorites(next);};
  return <div className={s.page}>
    <CustomerNav email={email}/>
    <main className={s.container}>
      
      <section className={s.promo} aria-label="Order ahead">
        <div className={s.promoCopy}>
          <p className={s.eyebrow}>SCHEDUBREW · YOUR COFFEE, YOUR TIME</p>
          <h1>Skip the line,<br/><span>savor your time.</span></h1>
          <p>Order ahead from your favorite local shops and pick up when it&apos;s ready.</p>
          <div className={s.promoBenefits}><span><ShoppingBag size={16}/> Order ahead with ease</span><span><Clock3 size={16}/> Choose your pickup time</span></div>
        </div>
        <div className={s.promoPhoto} role="img" aria-label="Coffee and fresh pastries"/>
      </section>
      <section className={s.searchControls} id="browse" aria-label="Shop search and filters">
        <form className={s.searchField} onSubmit={e=>{e.preventDefault();setQuery(searchInput)}}>
          <Search size={18} aria-hidden="true"/>
          <input aria-label="Search shops or products" value={searchInput} onChange={e=>{setSearchInput(e.target.value);setQuery(e.target.value)}} placeholder="Search coffee, milk tea, pastries, sandwiches..."/>
          {searchInput && <button type="button" onClick={()=>{setSearchInput('');setQuery('')}} aria-label="Clear search">×</button>}
        </form>
        <div className={s.searchExtras}>
          <span className={s.locationChip}><MapPin size={16}/> Pasig City <small>Selected area</small></span>
          <button type="button" className={s.filterButton} aria-expanded={showFilters} onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={17}/> Filters</button>
        </div>
      </section>
      {showFilters && <div className={s.filtersPanel}>
        <label>Sort shops <select value={sort} onChange={e=>setSort(e.target.value as Order)}><option value="recommended">Recommended</option><option value="fastest">Fastest preparation time</option><option value="top-rated">Highest rated</option></select></label>
        <label className={s.checkbox}><input type="checkbox" checked={quickPickup} onChange={e=>setQuickPickup(e.target.checked)}/> Estimated preparation: 12 minutes or less</label>
      </div>}
      <div className={s.categoryChips} aria-label="Food categories">{categories.map(cat=><button type="button" key={cat.id} className={`${s.categoryChip} ${category===cat.id?s.selectedChip:''}`} aria-pressed={category===cat.id} onClick={()=>chooseCategory(cat.id)}><span>{cat.icon}</span>{cat.label}</button>)}</div>
      <section className={s.section}>
        <div className={s.sectionTitle}><h2>Featured shops and picks</h2><span>{filteredShops.length} shop{filteredShops.length!==1?'s':''}</span></div>
        {filteredShops.length===0?<div className={s.empty}>No shops match your search. Try another category or turn off the quick pickup filter.</div>:<div className={s.shopGrid}>{filteredShops.map(shop=><article key={shop.id} className={s.shopCard}>
          <Link className={s.shopVisual} href={`/customer/shops/${shop.id}`}><Image src={shop.image} alt={`${shop.name} shop preview`} fill sizes="(max-width: 650px) 92vw, (max-width: 1050px) 44vw, 19vw"/><span className={s.prepChip}><Clock3 size={12}/> {shop.prepMinutes} min prep</span></Link>
          <button type="button" aria-label={favorites.includes(shop.id)?`Remove ${shop.name} from favorites`:`Save ${shop.name} to favorites`} onClick={()=>toggleFavorite(shop.id)} className={`${s.heartButton} ${favorites.includes(shop.id)?s.hearted:''}`}><Heart fill={favorites.includes(shop.id)?'currentColor':'none'} size={19}/></button>
          <div className={s.shopBody}><Link href={`/customer/shops/${shop.id}`} className={s.shopName}>{shop.name}</Link><p>{shop.types} · {shop.location}</p><div className={s.shopMeta}><span><Star size={13} fill="currentColor"/> {shop.rating.toFixed(1)} ({shop.reviewCount})</span><span>From ₱{shop.minimum}</span></div></div>
        </article>)}</div>}
      </section>
      <section className={s.section} id="featured-products">
        <div className={s.sectionTitle}><h2>Featured picks from local shops</h2><button type="button" className={s.viewAllButton} onClick={() => { setCategory("all"); setQuery(""); setSearchInput(""); setQuickPickup(false); window.history.replaceState(null,"","/customer#featured-products"); }}>View All <ArrowRight size={14}/></button></div>
        {filteredProducts.length===0?<div className={s.empty}>No products found in this category.</div>:<div className={s.pickGrid}>{filteredProducts.map(product=><Link className={s.pickCard} key={product.id} href={`/customer/shops/${product.shopId}`}><Image src={product.image} alt={product.name} width={105} height={94}/><div><b>{product.name}</b><small>{shops.find(x=>x.id===product.shopId)?.name}</small><strong>₱{product.price}</strong></div><ArrowRight size={16} className={s.pickArrow}/></Link>)}</div>}
      </section>
      <div className={s.previewUpcoming}>
        <section id="orders"><b><Link href="/customer/orders">My Orders →</Link></b><p>View your orders and follow pickup progress.</p></section>
        <section id="rewards"><b><Link href="/customer/rewards">Rewards →</Link></b><p>See your points, rewards, and completed orders.</p></section>
        <section id="profile"><b><Link href="/customer/profile">Profile →</Link></b><p>Manage pickup preferences and favorite shops.</p></section>
      </div>
      <footer className={s.footer}>ScheduBrew by The Ready Counter</footer>
    </main>
  </div>;
}
