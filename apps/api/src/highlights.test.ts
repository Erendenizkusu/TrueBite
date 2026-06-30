/**
 * AI öne çıkan özellikler orkestrasyon testi — sahte bağımlılıklarla (Google/Claude yok).
 *   node --test src/highlights.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import { getHighlights, type HighlightsDeps } from "./highlights.ts";
import type { HighlightTag } from "@truebite/shared";

function makeDeps(overrides: Partial<HighlightsDeps> = {}) {
  const calls = { fresh: 0, fetch: 0, extract: 0, upsert: 0 };
  const deps: HighlightsDeps = {
    freshHighlights: async () => {
      calls.fresh++;
      return null;
    },
    fetchReviews: async () => {
      calls.fetch++;
      return ["yemekler harikaydı", "çok temizdi"];
    },
    extract: async () => {
      calls.extract++;
      return ["Lezzetli", "Temiz"] as HighlightTag[];
    },
    upsert: async () => {
      calls.upsert++;
    },
    ...overrides,
  };
  return { deps, calls };
}

test("cache HIT — taze etiket varsa AI çağrılmaz", async () => {
  const { deps, calls } = makeDeps({
    freshHighlights: async () => ["Lezzetli", "Güler Yüz"] as HighlightTag[],
  });
  const res = await getHighlights("p1", deps);

  assert.equal(res.cached, true);
  assert.deepEqual(res.tags, ["Lezzetli", "Güler Yüz"]);
  assert.equal(calls.fetch, 0);
  assert.equal(calls.extract, 0);
});

test("cache MISS — yorum çek → AI etiketle → önbelleğe yaz", async () => {
  const order: string[] = [];
  const { deps } = makeDeps({
    freshHighlights: async () => null,
    fetchReviews: async () => {
      order.push("fetch");
      return ["temiz ve lezzetli"];
    },
    extract: async () => {
      order.push("extract");
      return ["Temiz", "Lezzetli"] as HighlightTag[];
    },
    upsert: async () => {
      order.push("upsert");
    },
  });
  const res = await getHighlights("p2", deps);

  assert.equal(res.cached, false);
  assert.equal(res.sourceReviewCount, 1);
  assert.deepEqual(order, ["fetch", "extract", "upsert"]);
});

test("boş etiket de önbelleğe yazılır (cache HIT için)", async () => {
  // freshHighlights null değil [] dönerse cache hit sayılır (yeniden AI çağrılmaz)
  const { deps, calls } = makeDeps({ freshHighlights: async () => [] });
  const res = await getHighlights("p3", deps);
  assert.equal(res.cached, true);
  assert.deepEqual(res.tags, []);
  assert.equal(calls.extract, 0);
});
