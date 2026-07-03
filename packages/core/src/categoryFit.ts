import { categoryByKey, type NearbyQuery, type ScoredPlace } from "@truebite/shared";

/**
 * Kategori-uyum (category-fit) katmanı — RealScore SONRASI, orkestrasyonda çalışır.
 * Amaç: döner listesindeki "asıl işi döner olmayan" genel Türk restoranlarını (Sultan/Beymen
 * gibi) yorum-analiziyle aşağı çekmek. Google puanı TÜM mekânın; bu katman o puanın aranan
 * KATEGORİDEN mi geldiğini yorumlarla ölçer.
 *
 * MALİYET GÜVENLİĞİ (altın kural): topN=0 → tam BYPASS (bugünkü davranış, sıfır maliyet).
 * Açıkken yalnızca görünen üst-N mekân için, o mekânın fit'i cache'te YOKSA bir Google
 * review-fetch + bir AI çağrısı yapılır (bütçe kapısından geçerek). Sonuç (place,kategori)
 * cache'lenir → ikinci kullanıcı bedava. Herhangi bir hata → o mekân için ayarlama yok
 * (RealScore korunur); tüm katman asla nearby'yi kırmaz (savunmacı).
 */
export interface CategoryFitDeps {
  topN: number;
  floor: number; // adjusted = realScore * (floor + (1-floor)*fit)
  freshFit: (placeId: string, category: string) => Promise<number | null>;
  fetchReviews: (placeId: string) => Promise<string[]>;
  scoreFit: (reviews: string[], categoryLabel: string) => Promise<number>;
  upsertFit: (placeId: string, category: string, fit: number, count: number) => Promise<void>;
  // Bütçe kapısı: bir review-fetch (1 Google çağrısı) yapmaya izin var mı? false → ayarlama yok.
  tryConsumeBudget: (calls: number) => Promise<boolean>;
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

/** Tek mekân için fit (0..1) döndürür; ayarlama yapılamıyorsa null. */
async function fitForPlace(
  place: ScoredPlace,
  categoryKey: string,
  categoryLabel: string,
  deps: CategoryFitDeps,
): Promise<number | null> {
  try {
    const cached = await deps.freshFit(place.placeId, categoryKey);
    if (cached != null) return cached;

    // Cache-miss → Google review-fetch maliyeti; bütçe kapısı.
    if (!(await deps.tryConsumeBudget(1))) return null;

    const reviews = await deps.fetchReviews(place.placeId);
    if (reviews.length === 0) {
      // Yorum yok → nötr; tekrar Google çağrısı olmasın diye cache'le.
      await deps.upsertFit(place.placeId, categoryKey, 0.7, 0);
      return 0.7;
    }
    const fit = await deps.scoreFit(reviews, categoryLabel);
    await deps.upsertFit(place.placeId, categoryKey, fit, reviews.length);
    return fit;
  } catch {
    return null; // savunmacı: bu mekân için ayarlama yok
  }
}

/**
 * Üst-N mekânı fit ile ölçekleyip KENDİ İÇİNDE yeniden sıralar; kuyruğu (N sonrası) olduğu
 * gibi bırakır (fit yalnızca görünen üst kümeyi yeniden dizer, kuyruğu yukarı taşımaz).
 */
export async function refineByCategoryFit(
  places: ScoredPlace[],
  q: NearbyQuery,
  deps: CategoryFitDeps,
): Promise<ScoredPlace[]> {
  // Kapalı, kategori "Tümü"/yok, ya da liste boş → bypass.
  if (deps.topN <= 0 || !q.category || places.length === 0) return places;
  const cat = categoryByKey(q.category);
  if (!cat.relevantTypes) return places; // "Tümü" — kategori kavramı yok

  const n = Math.min(deps.topN, places.length);
  const head = places.slice(0, n);
  const tail = places.slice(n);

  const fits = await Promise.all(head.map((p) => fitForPlace(p, cat.key, cat.label, deps)));

  const adjusted = head.map((p, i) => {
    const fit = fits[i];
    if (fit == null) return p; // ayarlama yok → RealScore korunur
    const factor = deps.floor + (1 - deps.floor) * fit;
    return { ...p, realScore: round3(p.realScore * factor) };
  });

  adjusted.sort((a, b) => b.realScore - a.realScore);
  return [...adjusted, ...tail];
}
