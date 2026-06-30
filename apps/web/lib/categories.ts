export interface Category {
  label: string;
  /** Google Places (New) tür kodu; null = tüm yemek mekanları. */
  type: string | null;
  /** CTA cümlesindeki isim: "Konumumdaki en popüler {ctaNoun} listele". */
  ctaNoun: string;
}

export const CATEGORIES: Category[] = [
  { label: "Tümü", type: null, ctaNoun: "mekanları" },
  { label: "Kahve", type: "coffee_shop", ctaNoun: "kahvecileri" },
  { label: "Döner", type: "turkish_restaurant", ctaNoun: "dönercileri" },
  { label: "Pizza", type: "pizza_restaurant", ctaNoun: "pizzacıları" },
  { label: "Sushi", type: "sushi_restaurant", ctaNoun: "suşi restoranlarını" },
  { label: "Burger", type: "hamburger_restaurant", ctaNoun: "burgercileri" },
  { label: "Balık", type: "seafood_restaurant", ctaNoun: "balık restoranlarını" },
  { label: "Tatlı", type: "dessert_shop", ctaNoun: "tatlıcıları" },
];
