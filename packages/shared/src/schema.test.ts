/**
 * zod şema testleri (zod gerektirir).
 *   node --test src/schema.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  nearbyQuerySchema,
  placeSchema,
  scoredPlaceSchema,
  nearbyResultSchema,
} from "./schema.ts";

test("nearbyQuery — HTTP string girdilerini coerce eder ve varsayılanları uygular", () => {
  const q = nearbyQuerySchema.parse({ lat: "40.99", lng: "29.03" });
  assert.equal(q.lat, 40.99);
  assert.equal(q.lng, 29.03);
  assert.equal(q.radiusM, 1500); // varsayılan
  assert.equal(q.limit, 50); // varsayılan
  assert.equal(q.category, null); // eksik → null
});

test("nearbyQuery — verilen kategori ve yarıçap korunur", () => {
  const q = nearbyQuerySchema.parse({ lat: 40.99, lng: 29.03, radiusM: "2000", category: "sushi" });
  assert.equal(q.radiusM, 2000);
  assert.equal(q.category, "sushi");
});

test("nearbyQuery — 'all' kategorisi null'a normalize edilir", () => {
  const q = nearbyQuerySchema.parse({ lat: 40.99, lng: 29.03, category: "all" });
  assert.equal(q.category, null);
});

test("nearbyQuery — aralık dışı koordinat reddedilir", () => {
  assert.throws(() => nearbyQuerySchema.parse({ lat: 91, lng: 0 }));
  assert.throws(() => nearbyQuerySchema.parse({ lat: 0, lng: 181 }));
});

test("nearbyQuery — limit üst sınırı (100) aşılırsa reddedilir", () => {
  assert.throws(() => nearbyQuerySchema.parse({ lat: 0, lng: 0, limit: 101 }));
});

test("place — puanı olmayan mekan (rating=null) geçerli", () => {
  const p = placeSchema.parse({
    placeId: "x",
    name: "Yeni Mekan",
    formattedAddress: null,
    lat: 40.99,
    lng: 29.03,
    rating: null,
    userRatingsTotal: 0,
    priceLevel: null,
    primaryType: null,
    types: [],
    businessStatus: "OPERATIONAL",
  });
  assert.equal(p.rating, null);
});

test("place — 5'ten büyük puan reddedilir", () => {
  assert.throws(() =>
    placeSchema.parse({
      placeId: "x",
      name: "Imkansız",
      formattedAddress: null,
      lat: 0,
      lng: 0,
      rating: 5.1,
      userRatingsTotal: 10,
      priceLevel: null,
      primaryType: null,
      types: [],
      businessStatus: null,
    }),
  );
});

test("nearbyResult — scoredPlace ile uçtan uca parse", () => {
  const result = nearbyResultSchema.parse({
    query: { lat: 40.99, lng: 29.03 },
    cellId: "sxk9",
    radiusBucket: 3,
    cacheHit: true,
    places: [
      {
        placeId: "demo_koklu",
        name: "Köklü Lokanta",
        formattedAddress: null,
        lat: 40.99,
        lng: 29.03,
        rating: 4.6,
        userRatingsTotal: 4500,
        priceLevel: null,
        primaryType: "restaurant",
        types: ["restaurant"],
        businessStatus: "OPERATIONAL",
        distanceM: 12.3,
        realScore: 4.522,
      },
    ],
  });
  assert.equal(result.places[0]?.realScore, 4.522);
  assert.equal(result.query.radiusM, 1500); // iç içe varsayılan da uygulanır
});
