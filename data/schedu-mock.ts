/** FRONTEND DEMO DATA ONLY. Shops, prices, ratings and pickup estimates are illustrative. */
export type CategoryId = 'all' | 'coffee' | 'milk-tea' | 'beverages' | 'shakes' | 'pastries' | 'sandwiches' | 'snacks';
export type Shop = {
  id: string;
  name: string;
  shortLabel: string;
  types: string;
  location: string;
  description: string;
  rating: number;
  reviewCount: number;
  prepMinutes: number;
  minimum: number;
  image: string;
  categories: CategoryId[];
};
export type Product = {
  id: string;
  shopId: string;
  name: string;
  category: CategoryId;
  description: string;
  price: number;
  image: string;
  rating: number;
  featured?: boolean;
};
export const categories: {id:CategoryId;label:string;icon:string}[] = [
  {id:'all',label:'All',icon:'☕'},
  {id:'coffee',label:'Coffee',icon:'☕'},
  {id:'milk-tea',label:'Milk Tea',icon:'🧋'},
  {id:'beverages',label:'Beverage Drinks',icon:'🥤'},
  {id:'shakes',label:'Shakes',icon:'🍨'},
  {id:'pastries',label:'Bread and Pastries',icon:'🥐'},
  {id:'sandwiches',label:'Sandwiches',icon:'🥪'},
  {id:'snacks',label:'Snacks and Meals',icon:'🍟'},
];
const imageRoot='/schedu/discovery/';
export const shops: Shop[] = [
  {id:'brewed-awakenings',name:'Brewed Awakenings',shortLabel:'Brewed',types:'Coffee and Pastries',location:'Pasig City',description:'Coffeehouse favorites and freshly baked snacks.',rating:4.9,reviewCount:328,prepMinutes:12,minimum:120,image:imageRoot+'shop-brewed-awakenings.jpg',categories:['coffee','pastries']},
  {id:'tea-time-milktea-bar',name:'Tea Time Milktea Bar',shortLabel:'Tea Time',types:'Milk Tea',location:'Pasig City',description:'Creamy tea favorites and refreshing cold drinks.',rating:4.8,reviewCount:256,prepMinutes:15,minimum:100,image:imageRoot+'shop-tea-time-milktea-bar.jpg',categories:['milk-tea','beverages']},
  {id:'chill-shakes',name:'Chill Shakes',shortLabel:'Chill',types:'Shakes',location:'Ortigas',description:'Rich shakes and blended drinks for your break.',rating:4.7,reviewCount:189,prepMinutes:10,minimum:110,image:imageRoot+'shop-chill-shakes.jpg',categories:['shakes','beverages']},
  {id:'the-sandwich-spot',name:'The Sandwich Spot',shortLabel:'Sandwich Spot',types:'Sandwiches',location:'Pasig City',description:'Freshly prepared sandwiches and savory snacks.',rating:4.8,reviewCount:142,prepMinutes:18,minimum:130,image:imageRoot+'shop-the-sandwich-spot.jpg',categories:['sandwiches','snacks']},
  {id:'goodbite-kitchen',name:'GoodBite Kitchen',shortLabel:'GoodBite',types:'Meals',location:'Mandaluyong',description:'Comfort meals and everyday local favorites.',rating:4.7,reviewCount:312,prepMinutes:20,minimum:130,image:imageRoot+'shop-goodbite-kitchen.jpg',categories:['snacks']},
];
const p=(id:string,shopId:string,name:string,category:CategoryId,price:number,description:string,rating=4.8,featured=false):Product=>({id,shopId,name,category,price,description,image:imageRoot+'product-'+id+'.jpg',rating,featured});
export const products: Product[] = [
  p('spanish-latte','brewed-awakenings','Spanish Latte','coffee',155,'Sweet and creamy with a hint of cinnamon.',4.8,true),
  p('cappuccino','brewed-awakenings','Cappuccino','coffee',145,'Classic espresso with foamy milk.',4.6,true),
  p('caramel-macchiato','brewed-awakenings','Caramel Macchiato','coffee',160,'Creamy espresso with vanilla and caramel.',4.6,true),
  p('brown-sugar-milk-tea','tea-time-milktea-bar','Brown Sugar Milk Tea','milk-tea',130,'Brown sugar, milk and chewy pearls.',4.9,true),
  p('wintermelon-milk-tea','tea-time-milktea-bar','Wintermelon Milk Tea','milk-tea',145,'Smooth wintermelon with milk and pearls.',4.7,true),
  p('matcha-latte','brewed-awakenings','Matcha Latte','beverages',155,'Premium matcha with steamed milk.',4.8,true),
  p('lemon-tea','tea-time-milktea-bar','Lemon Tea','beverages',120,'Refreshing lemon tea with honey.',4.6,true),
  p('chocolate-banana-shake','chill-shakes','Chocolate Banana Shake','shakes',150,'Rich chocolate blended with banana.',4.7,true),
  p('glazed-donut','brewed-awakenings','Glazed Donut','pastries',65,'Soft and sweet classic glazed donut.',4.7,true),
  p('croissant','brewed-awakenings','Croissant','pastries',80,'Buttery, flaky and freshly baked.',4.8,true),
  p('cheese-bread','brewed-awakenings','Cheese Bread','pastries',65,'Soft bread filled with cheesy goodness.',4.8,true),
  p('ensaymada','brewed-awakenings','Ensaymada','pastries',65,'Soft, fluffy and sweet ensaymada.',4.8,true),
  p('ham-cheese-sandwich','the-sandwich-spot','Ham and Cheese Sandwich','sandwiches',120,'Toasted sandwich with ham and cheese.',4.6,true),
  p('french-fries','the-sandwich-spot','French Fries','snacks',90,'Crispy golden fries with ketchup.',4.6,true),
  p('creamy-carbonara','goodbite-kitchen','Creamy Carbonara','snacks',160,'Creamy pasta with bacon and parmesan.',4.7,true),
  p('chicken-adobo-rice','goodbite-kitchen','Chicken Adobo Rice','snacks',165,'Classic adobo served with garlic rice.',4.8,true),
  p('beef-tapa-rice','goodbite-kitchen','Beef Tapa Rice','snacks',165,'Savory beef tapa with garlic rice.',4.7,true),
  p('clubhouse-sandwich','the-sandwich-spot','Clubhouse Sandwich','sandwiches',150,'Triple decker with ham, bacon and egg.',4.7,true),
];
export const peso=(value:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value);
export const findShop=(id:string)=>shops.find(s=>s.id===id);
export const getShopProducts=(id:string)=>products.filter(p=>p.shopId===id);
