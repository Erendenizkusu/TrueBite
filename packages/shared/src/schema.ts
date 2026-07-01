/**
 * TrueBite — Paylaşılan zod şemaları + çıkarsanan TS tipleri.
 *
 * zod, runtime doğrulamanın TEK kaynağıdır; TS tipleri `z.infer` ile buradan türetilir
 * (drift olmaz). İstemciden gelen güvenilmez girdiler (örn. HTTP query parametreleri)
 * bu şemalarla parse edilir.
 */

import { z } from "zod";

/** Yakındaki mekan sorgusu. HTTP query string'inden geldiği için sayılar coerce edilir. */
export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusM: z.coerce.number().int().positive().max(50000).default(1500),
  limit: z.coerce.number().int().positive().max(100).default(50),
  // Kategori anahtarı (örn. "sushi"); boş/eksik/"all" → null (tür kısıtı yok).
  // Alakalı Google türleri + eleme, API'de bu anahtardan çözülür (bkz. categories.ts).
  category: z
    .string()
    .min(1)
    .nullish()
    .transform((v) => (v && v !== "all" ? v : null)),
});

/** `places` tablosu / Google Places'ten normalize edilmiş mekan. */
export const placeSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  formattedAddress: z.string().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  rating: z.number().min(0).max(5).nullable(),
  userRatingsTotal: z.number().int().nonnegative(),
  priceLevel: z.number().int().min(0).max(4).nullable(),
  primaryType: z.string().nullable(),
  types: z.array(z.string()),
  businessStatus: z.string().nullable(),
});

/** `nearby_places` SQL fonksiyonunun bir satırı: mekan + mesafe + RealScore. */
export const scoredPlaceSchema = placeSchema.extend({
  distanceM: z.number().nonnegative(),
  realScore: z.number(),
});

/** API yanıtı: sorgu + önbellek meta verisi + sıralı mekanlar. */
export const nearbyResultSchema = z.object({
  query: nearbyQuerySchema,
  cellId: z.string(),
  radiusBucket: z.number().int(),
  cacheHit: z.boolean(),
  places: z.array(scoredPlaceSchema),
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type Place = z.infer<typeof placeSchema>;
export type ScoredPlace = z.infer<typeof scoredPlaceSchema>;
export type NearbyResult = z.infer<typeof nearbyResultSchema>;
