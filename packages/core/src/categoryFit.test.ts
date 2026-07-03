import { test } from "node:test";
import assert from "node:assert/strict";
import type { NearbyQuery, ScoredPlace } from "@truebite/shared";
import { refineByCategoryFit, type CategoryFitDeps } from "./categoryFit.ts";

function place(id: string, realScore: number): ScoredPlace {
  return {
    placeId: id,
    name: id,
    formattedAddress: null,
    lat: 0,
    lng: 0,
    rating: 4.5,
    userRatingsTotal: 500,
    priceLevel: null,
    primaryType: null,
    types: [],
    businessStatus: null,
    distanceM: 100,
    realScore,
  };
}

const Q: NearbyQuery = { lat: 0, lng: 0, radiusM: 4000, limit: 12, category: "doner" };

/** Varsayılan sahte deps — testte gerektikçe override edilir. */
function deps(over: Partial<CategoryFitDeps> = {}): CategoryFitDeps {
  return {
    topN: 5,
    floor: 0.6,
    freshFit: async () => null,
    fetchReviews: async () => ["Döner harikaydı", "Eti taze"],
    scoreFit: async () => 1,
    upsertFit: async () => {},
    tryConsumeBudget: async () => true,
    ...over,
  };
}

test("topN=0 → tam bypass (liste dokunulmadan döner)", async () => {
  const input = [place("a", 4.5), place("b", 4.6)];
  const out = await refineByCategoryFit(input, Q, deps({ topN: 0 }));
  assert.deepEqual(out, input);
});

test("kategori 'Tümü'/yok → bypass", async () => {
  const input = [place("a", 4.5), place("b", 4.6)];
  const out = await refineByCategoryFit(input, { ...Q, category: null }, deps());
  assert.deepEqual(out, input);
});

test("harmanla + yeniden sırala: düşük fit'li yüksek-puanlı, yüksek fit'li düşük-puanlının altına iner", async () => {
  // A: base 4.5, fit 1.0 → 4.5 ; B: base 4.6, fit 0.2 → 4.6*(0.6+0.4*0.2)=3.128
  const fits: Record<string, number> = { a: 1.0, b: 0.2 };
  const out = await refineByCategoryFit(
    [place("a", 4.5), place("b", 4.6)],
    Q,
    deps({ scoreFit: async (_r, _l) => 0, freshFit: async (id) => fits[id] ?? null }),
  );
  assert.equal(out[0]!.placeId, "a");
  assert.equal(out[1]!.placeId, "b");
  assert.equal(out[0]!.realScore, 4.5);
  assert.equal(out[1]!.realScore, round3(4.6 * (0.6 + 0.4 * 0.2)));
});

test("cache HIT → fetchReviews/scoreFit çağrılmaz (maliyet yok)", async () => {
  let reviewCalls = 0;
  let scoreCalls = 0;
  await refineByCategoryFit(
    [place("a", 4.5)],
    Q,
    deps({
      freshFit: async () => 0.9,
      fetchReviews: async () => {
        reviewCalls++;
        return [];
      },
      scoreFit: async () => {
        scoreCalls++;
        return 1;
      },
    }),
  );
  assert.equal(reviewCalls, 0);
  assert.equal(scoreCalls, 0);
});

test("bütçe DOLU → ayarlama yok (RealScore korunur)", async () => {
  const out = await refineByCategoryFit(
    [place("a", 4.5), place("b", 4.6)],
    Q,
    deps({ tryConsumeBudget: async () => false }),
  );
  // Sıralama base'e göre; skorlar dokunulmaz.
  assert.equal(out[0]!.realScore, 4.6);
  assert.equal(out[1]!.realScore, 4.5);
});

test("yorum yok → nötr 0.7 + cache'lenir (tekrar Google olmasın)", async () => {
  let upserted: number | null = null;
  const out = await refineByCategoryFit(
    [place("a", 5.0)],
    Q,
    deps({ fetchReviews: async () => [], upsertFit: async (_p, _c, fit) => void (upserted = fit) }),
  );
  assert.equal(upserted, 0.7);
  assert.equal(out[0]!.realScore, round3(5.0 * (0.6 + 0.4 * 0.7)));
});

test("scoreFit hata fırlatırsa o mekân için ayarlama yok (savunmacı)", async () => {
  const out = await refineByCategoryFit(
    [place("a", 4.2)],
    Q,
    deps({
      scoreFit: async () => {
        throw new Error("AI patladı");
      },
    }),
  );
  assert.equal(out[0]!.realScore, 4.2);
});

test("kuyruk (topN sonrası) olduğu gibi korunur ve altta kalır", async () => {
  const out = await refineByCategoryFit(
    [place("a", 4.9), place("b", 4.8), place("c", 4.7)],
    Q,
    deps({ topN: 2, scoreFit: async () => 0, freshFit: async () => 0 }),
  );
  // a,b fit=0 → *0.6; c dokunulmaz, hep sonda.
  assert.equal(out[2]!.placeId, "c");
  assert.equal(out[2]!.realScore, 4.7);
});

const round3 = (x: number) => Math.round(x * 1000) / 1000;
