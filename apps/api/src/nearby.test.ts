/**
 * Orkestrasyon akışı testleri — sahte bağımlılıklarla (Supabase/Google yok).
 *   node --test src/nearby.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import { getNearby, type NearbyDeps } from "./nearby.ts";
import type { NearbyQuery, Place } from "@truebite/shared";

const q: NearbyQuery = { lat: 40.99, lng: 29.03, radiusM: 2000, limit: 50, category: null };

function makeDeps(overrides: Partial<NearbyDeps> = {}) {
  const calls = { fetch: 0, upsert: 0, touch: 0, query: 0 };
  const deps: NearbyDeps = {
    cellPrecision: 6,
    isCellFresh: async () => true,
    fetchFromGoogle: async () => {
      calls.fetch++;
      return [];
    },
    upsertPlaces: async () => {
      calls.upsert++;
      return 0;
    },
    touchCell: async () => {
      calls.touch++;
    },
    queryNearby: async () => {
      calls.query++;
      return [];
    },
    ...overrides,
  };
  return { deps, calls };
}

test("cache HIT — Google'a gidilmez, sadece DB sorgulanır", async () => {
  const { deps, calls } = makeDeps({ isCellFresh: async () => true });
  const res = await getNearby(q, deps);

  assert.equal(res.cacheHit, true);
  assert.equal(calls.fetch, 0);
  assert.equal(calls.upsert, 0);
  assert.equal(calls.touch, 0);
  assert.equal(calls.query, 1);
  assert.equal(res.radiusBucket, 4); // ceil(2000/500)
  assert.equal(res.cellId.length, 6); // precision 6
});

test("cache MISS — sıra: Google → upsert → touch → query", async () => {
  const order: string[] = [];
  const onePlace: Place = {
    placeId: "x",
    name: "X",
    formattedAddress: null,
    lat: 40.99,
    lng: 29.03,
    rating: 4.5,
    userRatingsTotal: 100,
    priceLevel: null,
    primaryType: "restaurant",
    types: ["restaurant"],
    businessStatus: "OPERATIONAL",
  };
  const { deps } = makeDeps({
    isCellFresh: async () => false,
    fetchFromGoogle: async () => {
      order.push("fetch");
      return [onePlace];
    },
    upsertPlaces: async () => {
      order.push("upsert");
      return 1;
    },
    touchCell: async () => {
      order.push("touch");
    },
    queryNearby: async () => {
      order.push("query");
      return [];
    },
  });

  const res = await getNearby(q, deps);
  assert.equal(res.cacheHit, false);
  assert.deepEqual(order, ["fetch", "upsert", "touch", "query"]);
});
