/**
 * TrueBite — Kategori tanımları (TEK DOĞRULUK KAYNAĞI).
 *
 * Web, mobil ve API bu listeyi paylaşır (kopya yok). Her kategori, Google Places (New)
 * taksonomisindeki "alakalı türler" kümesine eşlenir.
 *
 * FİLTRELEME FELSEFESİ ("dengeli" kural — gerçekçilik için kalibre edildi):
 *   Bir mekân bir kategoriye girer  ⟺
 *     (kategorinin alakalı türleri) ∩ (mekânın types dizisi) ≠ ∅   [alaka]
 *     VE  primaryType bir bar/mekân türü DEĞİL (EXCLUDED_PRIMARY_TYPES)  [gerçek yemek işletmesi]
 *
 * Neden sadece primaryType değil: Ono (gerçek sushi) → primaryType "restaurant", sushi
 * ikincil. Katı primary eşleşme onu KAÇIRIR. Neden sadece types-içinde-ara değil: Rotown
 * (canlı müzik mekânı) → types'ında sushi_restaurant var; gevşek eşleşme onu YANLIŞ ALIR.
 * İki koşulun kesişimi ikisini de doğru yapar (bkz. seed/kalibrasyon notları).
 */

export interface Category {
  /** Kararlı kimlik — istemci API'ye bunu `category` olarak gönderir. */
  key: string;
  /** UI etiketi (çip + başlık). */
  label: string;
  /** CTA cümlesindeki isim: "Konumumdaki en popüler {ctaNoun} listele". */
  ctaNoun: string;
  /**
   * Bu kategoriye ait sayılması için mekânın types dizisiyle kesişmesi gereken
   * Google türleri. null = "Tümü" (tür kısıtı yok, yalnızca yemek mekânları).
   */
  relevantTypes: string[] | null;
  /**
   * KATI mod: mekânın primaryType'ı doğrudan relevantTypes'tan biri olmalı.
   * İçecek/tatlı kategorileri için (kahve, tatlı) — aksi halde "kahve servis eden HER
   * restoran" listeye girerdi. Yemek kategorilerinde (sushi, pizza…) false: generic
   * primaryType'lı gerçek mekânlar (Ono → primary "restaurant") da kabul edilir.
   */
  strictPrimary?: boolean;
  /**
   * AD-bazlı dahil etme (regex). Google taksonomisinde ayrı türü OLMAYAN alt-mutfaklar için
   * (çiğ köfte gibi — dönerle aynı `turkish_restaurant` türünde). Verilirse yalnızca adı bu
   * regex'e uyan mekânlar kategoriye girer. Postgres `~*` (case-insensitive) ile uygulanır.
   */
  nameInclude?: string;
  /**
   * AD-bazlı hariç tutma (regex). Adı bu regex'e uyan mekânlar kategoriden ELENİR.
   * Örn. döner: çiğ köftecileri (aynı türde) dışarıda tutmak için.
   */
  nameExclude?: string;
}

/**
 * Çiğ köfte adı deseni (case-insensitive, diakritik + ASCII + TÜMÜ-BÜYÜK-HARF varyantları).
 * Kapsar: "çiğ köfte", "çiğköfte", "cig kofte", "çiğköfteci", "ÇİĞ KÖFTE", "ÇİĞKÖFTECİM"…
 * KULLANIM: döner kategorisinden çiğ köftecileri DIŞLAMAK (nameExclude). Google Places'te
 * çiğ köftecilerin ayrı türü yok (döner gibi `turkish_restaurant`) → tek ayırt edici sinyal ADI.
 * NOT: Ayrı "Çiğ Köfte" kategorisi kasıtlı EKLENMEDİ — çiğ köfte ayaküstü sokak lezzeti, "en iyi
 * mekânı ara" niyeti zayıf (ürün kararı). Yine de döner listesini kirletmemesi için dışlanır.
 * NOT: Türkçe BÜYÜK harf diakritikleri (İ, Ğ, Ö) Postgres `~*` ASCII case-folding'iyle küçük
 * harfe katlanmaz → karakter sınıflarına AÇIKÇA eklendi (aksi halde tümü-büyük-harf adlar kaçardı).
 * Gerçek Postgres'te 10 örnek adla doğrulandı (çiğ köfte varyantları t, döner/düz-köfte f).
 */
export const CIGKOFTE_NAME_PATTERN = "[çÇ]?[iİ][ğĞgG]\\s*k[öÖoO]fte";

/**
 * DÖNER kategorisini kirleten, Google'ın AYNI `turkish_restaurant` türüne koyduğu bitişik
 * mutfaklar — ad-bazlı DIŞLA (nameExclude). Test geri bildirimi (2026-07-03, Konya + diğer
 * konumlar): döner listesine çiğ köfteciler + kokoreççiler + etli ekmekçiler + pizzacılar
 * sızıyordu (hepsi `turkish_restaurant` etiketli; primaryType generic olduğu için tür-kapısını
 * geçiyorlar). Ayırt edici tek güvenilir sinyal = mekân ADI → regex alternasyonu.
 *   - kokoreç / KOKOREÇ / kokoreçci      → "kokore[çÇcC]"
 *   - etli ekmek / ETLİ EKMEK (Konya)     → "etl[iİ]\s*ekmek"
 *   - pizza / PİZZA / pizzacı             → "p[iİ]zza"
 * NOT (Postgres `~*` ASCII case-fold): Türkçe BÜYÜK harf diakritikleri (İ, Ç, Ö) küçüğe
 * katlanmaz → karakter sınıflarına AÇIKÇA eklendi (aksi halde TÜMÜ-BÜYÜK adlar kaçardı).
 * TAKAS: "Döner & Pizza" gibi kombo dükkânlar da elenebilir (asıl-işi döner değil sayılır);
 * ince ayrım ileride AI kategori-uyum skoruna ait (bkz [[place-filtering-logic]]).
 */
export const KOKOREC_NAME_PATTERN = "kokore[çÇcC]";
export const ETLI_EKMEK_NAME_PATTERN = "etl[iİ]\\s*ekmek";
export const PIZZA_NAME_PATTERN = "p[iİ]zza";

/** Döner nameExclude — çiğ köfte + kokoreç + etli ekmek + pizza (regex alternasyonu). */
export const DONER_EXCLUDE_PATTERN = [
  CIGKOFTE_NAME_PATTERN,
  KOKOREC_NAME_PATTERN,
  ETLI_EKMEK_NAME_PATTERN,
  PIZZA_NAME_PATTERN,
].join("|");

export const CATEGORIES: Category[] = [
  { key: "all", label: "Tümü", ctaNoun: "mekanları", relevantTypes: null },
  { key: "coffee", label: "Kahve", ctaNoun: "kahvecileri", relevantTypes: ["coffee_shop", "cafe"], strictPrimary: true },
  { key: "doner", label: "Döner", ctaNoun: "dönercileri", relevantTypes: ["turkish_restaurant"], nameExclude: DONER_EXCLUDE_PATTERN },
  { key: "pizza", label: "Pizza", ctaNoun: "pizzacıları", relevantTypes: ["pizza_restaurant"] },
  { key: "sushi", label: "Sushi", ctaNoun: "suşi restoranlarını", relevantTypes: ["sushi_restaurant"] },
  { key: "burger", label: "Burger", ctaNoun: "burgercileri", relevantTypes: ["hamburger_restaurant"] },
  { key: "seafood", label: "Balık", ctaNoun: "balık restoranlarını", relevantTypes: ["seafood_restaurant"] },
  { key: "dessert", label: "Tatlı", ctaNoun: "tatlıcıları", relevantTypes: ["dessert_shop", "ice_cream_shop", "dessert_restaurant"], strictPrimary: true },
];

/**
 * "Spesifik işletme" primaryType'ları — bir mekânın ASIL işini belli eden türler.
 * Yemek kategorisi aramasında (katı olmayan), mekânın primaryType'ı bunlardan biriyse
 * VE aranan kategori değilse elenir: o mekânın asıl işi başka (kafe/fırın/ramen…).
 *   Örn. "Café in The City" (primary 'cafe', types'ında sushi var) → sushi'de ELENİR.
 *   Ono (primary 'restaurant' = generic, listede yok) → ELENMEZ (gerçek sushi).
 * Not: japanese_restaurant KASITLI dışarıda — birçok gerçek sushi mekânı böyle etiketli,
 * generic sayılıp korunur. Bar/sahne türleri EXCLUDED_PRIMARY_TYPES'ta ayrıca elenir.
 */
export const SPECIFIC_PRIMARY_TYPES = [
  // içecek / atıştırma / tatlı
  "coffee_shop", "cafe", "tea_house", "juice_shop",
  "bakery", "bagel_shop", "donut_shop", "sandwich_shop",
  "ice_cream_shop", "chocolate_shop", "confectionery", "candy_store", "dessert_shop",
  // belirli mutfaklar (kategori-tanımlayıcı)
  "sushi_restaurant", "ramen_restaurant", "pizza_restaurant", "hamburger_restaurant",
  "turkish_restaurant", "seafood_restaurant", "dessert_restaurant",
];

/**
 * "Tümü" araması ve tür-belirtilmemiş Google çekimi için yemek-odaklı varsayılan türler.
 * (Google'a tür verilmezse otopark/mağaza/belediye de döner — bunu engeller.)
 */
export const DEFAULT_FOOD_TYPES = ["restaurant", "cafe", "coffee_shop", "bakery", "meal_takeaway"];

/**
 * primaryType'ı bunlardan biriyse mekân "yemek işletmesi değil, bar/sahne/etkinlik mekânı"
 * sayılır ve SPESİFİK kategori sonuçlarından + "Tümü"den elenir. (İkincil türlerde sushi/
 * yemek olması onu bir yemek mekânı yapmaz — kullanıcıyı yanlış yönlendirmeyiz.)
 */
export const EXCLUDED_PRIMARY_TYPES = [
  "bar",
  "pub",
  "wine_bar",
  "cocktail_bar",
  "night_club",
  "live_music_venue",
  "concert_hall",
  "auditorium",
  "event_venue",
  "banquet_hall",
  "casino",
  "bowling_alley",
  "movie_theater",
];

/**
 * types-düzeyinde eleme — ARTIK BOŞ (kasıtlı). Önceden cocktail_bar/night_club gibi türleri
 * types'ında taşıyan mekânları eliyorduk; ama bu, o kategoride GERÇEKTEN iyi olan mekânları
 * (ör. Café in The City — iyi sushi yapıyor ama cocktail_bar da) haksız yere siliyordu.
 * "Mekânın puanı aradığımız kategoriden mi geliyor?" sorusu tip-yasağıyla değil, AI kategori-
 * uyum skoruyla (yorum analizi) çözülecek. ASIL işi bar olanlar primaryType düzeyinde
 * (EXCLUDED_PRIMARY_TYPES: bar/cocktail_bar/night_club…) zaten eleniyor.
 */
export const EXCLUDED_TYPES: string[] = [];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

/** Kategori anahtarından Category döner; bilinmeyen/null → "Tümü". */
export function categoryByKey(key: string | null | undefined): Category {
  return (key && BY_KEY.get(key)) || CATEGORIES[0]!;
}
