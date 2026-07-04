/**
 * Volicious — Önbellek grid anahtarı (geohash).
 *
 * MİMARİ: Önbellek anahtarı ham lat/lng DEĞİLDİR (her sorgu benzersiz koordinat olur,
 * önbellek hiç tutmaz). Bunun yerine konum bir geohash hücresine yuvarlanır. Bu `cell_id`
 * Supabase `cache_cells` tablosunda TEXT olarak saklanır; DB hiçbir grid eklentisine
 * bağımlı değildir (hesap burada, uygulama katmanında yapılır).
 *
 * Saf TypeScript, sıfır bağımlılık.
 */

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Standart geohash kodlaması. `precision` yaklaşık hücre boyutunu belirler:
 *   5 ≈ 4.9km × 4.9km · 6 ≈ 1.2km × 0.6km · 7 ≈ 153m × 153m
 */
export function encodeGeohash(lat: number, lng: number, precision = 6): string {
  if (precision < 1) throw new RangeError("precision >= 1 olmalı");
  if (lat < -90 || lat > 90) throw new RangeError("lat -90..90 aralığında olmalı");
  if (lng < -180 || lng > 180) throw new RangeError("lng -180..180 aralığında olmalı");

  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // boylam (lng)
      const lonMid = (lonMin + lonMax) / 2;
      if (lng >= lonMid) {
        idx = idx * 2 + 1;
        lonMin = lonMid;
      } else {
        idx = idx * 2;
        lonMax = lonMid;
      }
    } else {
      // enlem (lat)
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx * 2 + 1;
        latMin = latMid;
      } else {
        idx = idx * 2;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}

/** Önbellek hücre kimliği — bir konumu grid hücresine yuvarlar. */
export function cellId(lat: number, lng: number, precision = 6): string {
  return encodeGeohash(lat, lng, precision);
}

/**
 * Yarıçapı bucket'lar — yakın yarıçaplı sorgular aynı önbellek satırını paylaşsın diye.
 * `cache_cells` birincil anahtarının ikinci bileşeni (cell_id, radius_bucket).
 */
export function radiusBucket(radiusM: number, bucketM = 500): number {
  if (radiusM <= 0) throw new RangeError("radiusM > 0 olmalı");
  return Math.ceil(radiusM / bucketM);
}
