/**
 * Google yanıt normalizasyonu testleri.
 *   node --test src/google.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import { normalizeGooglePlaces } from "./google.ts";

const sample = {
  places: [
    {
      id: "ChIJ_koklu",
      displayName: { text: "Köklü Lokanta", languageCode: "tr" },
      formattedAddress: "Kadıköy, İstanbul",
      location: { latitude: 40.99, longitude: 29.03 },
      rating: 4.6,
      userRatingCount: 4500,
      priceLevel: "PRICE_LEVEL_MODERATE",
      primaryType: "restaurant",
      types: ["restaurant", "food"],
      businessStatus: "OPERATIONAL",
    },
    {
      id: "ChIJ_yeni",
      displayName: { text: "Yeni Mekan" },
      location: { latitude: 40.991, longitude: 29.031 },
      // rating ve userRatingCount yok (yeni mekan)
    },
  ],
};

test("normalizeGooglePlaces — alanları doğru eşler", () => {
  const places = normalizeGooglePlaces(sample);
  assert.equal(places.length, 2);

  assert.equal(places[0]?.placeId, "ChIJ_koklu");
  assert.equal(places[0]?.name, "Köklü Lokanta");
  assert.equal(places[0]?.rating, 4.6);
  assert.equal(places[0]?.userRatingsTotal, 4500);
  assert.equal(places[0]?.priceLevel, 2); // MODERATE → 2
  assert.deepEqual(places[0]?.types, ["restaurant", "food"]);
});

test("puanı olmayan mekan → rating null, yorum 0", () => {
  const places = normalizeGooglePlaces(sample);
  assert.equal(places[1]?.rating, null);
  assert.equal(places[1]?.userRatingsTotal, 0);
  assert.equal(places[1]?.formattedAddress, null);
});

test("boş yanıt → boş dizi", () => {
  assert.deepEqual(normalizeGooglePlaces({}), []);
  assert.deepEqual(normalizeGooglePlaces(null), []);
});
