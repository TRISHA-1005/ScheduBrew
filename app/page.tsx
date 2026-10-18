import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, ShoppingBag } from "lucide-react";
import { Brand } from "@/components/schedu/brand";
import { AuthCard } from "@/components/schedu/auth-card";
import s from "@/components/schedu/schedu.module.css";

const categories = [
  { name: "Coffee", image: "coffee", slug: "coffee" },
  { name: "Milk Tea", image: "milk-tea", slug: "milk-tea" },
  { name: "Beverage Drinks", image: "beverages", slug: "beverages" },
  { name: "Shakes", image: "shakes", slug: "shakes" },
  { name: "Bread & Pastries", image: "pastries", slug: "pastries" },
  { name: "Sandwiches", image: "sandwiches", slug: "sandwiches" },
  { name: "Snacks & Meals", image: "snacks", slug: "snacks" },
];

export default function CustomerLoginPage() {
  return (
    <div className={s.site}>
      <header className={s.navbar}>
        <Brand />
        <nav className={s.navLinks} aria-label="Main navigation">
          <Link href="/customer">Discover</Link>
          <Link href="/customer#orders">My Orders</Link>
          <Link href="/customer#rewards">Rewards</Link>
          <Link href="/customer#profile">Profile</Link>
          <Link className={s.orderButton} href="/customer">Start an Order</Link>
          <Link href="/auth/business" className={s.avatar} title="Business owner sign in" aria-label="Business owner sign in">TRC</Link>
        </nav>
      </header>

      <main className={s.main}>
        <div className={s.heroGrid}>
          <section className={s.heroPanel} aria-label="ScheduBrew benefits">
            <div className={s.foodImage} aria-hidden="true" />
            <div className={s.heroCopy}>
              <h1>Order ahead.<br/><span>Skip the line.</span></h1>
              <p>Your favorite coffee, milk tea, snacks, and local favorites, ready when you are.</p>
              <ul className={s.benefits}>
                <li><Clock3 size={22}/> Schedule pickup in advance</li>
                <li><ShoppingBag size={22}/> Skip the queue and save time</li>
                <li><MapPin size={22}/> Support local coffee and snack shops</li>
              </ul>
            </div>
            <div className={s.sandwichImage} aria-hidden="true" />
          </section>
          <AuthCard kind="customer" />
        </div>

        <section className={s.categories} aria-labelledby="category-title" id="categories">
          <div className={s.categoriesHeading}><span></span><h2 id="category-title">What you can order</h2><span></span></div>
          <div className={s.categoriesGrid}>
            {categories.map((category) => (
              <Link key={category.slug} href={`/customer?category=${category.slug}#browse`} className={s.categoryItem}>
                <Image src={`/schedu/categories/${category.image}.png`} alt="" width={78} height={78}/>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
        <div className={s.portalLink}>Have a partner shop? <Link href="/auth/business">Go to Business Owner Sign In →</Link></div>
      </main>
    </div>
  );
}
