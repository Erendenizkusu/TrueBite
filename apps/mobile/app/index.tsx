import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { ScoredPlace } from "@truebite/shared";
import { fetchNearby, grantQuota } from "@/lib/api";
import { colors, font, radius } from "@/lib/theme";
import { CATEGORIES } from "@/lib/categories";
import { Brand } from "@/components/Brand";
import { SpotCard } from "@/components/SpotCard";

// KONUM-BAĞIMSIZ & konsept-öncelikli: kullanıcı butona basınca konum alınır.
const FALLBACK = { lat: 51.9225, lng: 4.4792 }; // izin yoksa: Rotterdam

type Status = "idle" | "locating" | "ready" | "denied";
type Coords = { lat: number; lng: number };

export default function Discover() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [catIdx, setCatIdx] = useState(0);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const cat = CATEGORIES[catIdx]!;

  const [granting, setGranting] = useState(false);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["nearby", coords?.lat, coords?.lng, cat.key],
    queryFn: () => fetchNearby(coords!.lat, coords!.lng, 4000, cat.key),
    enabled: status === "ready" && !!coords,
  });
  // Ayrıştırılmış dönüş: ok / kota-doldu / hata.
  const result = data?.kind === "ok" ? data.result : null;
  const places = result?.places ?? [];
  const quotaExceeded = data?.kind === "quota";
  const remaining = data && data.kind !== "error" ? data.quota.remaining : null;

  // "Reklam izle → +1 keşif" (STUB: gerçek AdMob rewarded ad'e kadar geçici).
  async function watchAdForMore() {
    setGranting(true);
    try {
      if (await grantQuota()) await refetch();
    } finally {
      setGranting(false);
    }
  }

  async function locateAndSearch() {
    setStatus("locating");
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setCoords(FALLBACK);
        setStatus("denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus("ready");
    } catch {
      setCoords(FALLBACK);
      setStatus("denied");
    }
  }
  // "denied" durumunda da fallback ile sonuç göster
  const ready = status === "ready" || status === "denied";

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.paper }}>
      <View style={s.header}>
        <Brand />
        <Text style={s.headerTag}>GERÇEK PUAN, GERÇEK MEKAN</Text>
      </View>

      <FlatList
        data={ready && !quotaExceeded ? places : []}
        keyExtractor={(p: ScoredPlace) => p.placeId}
        renderItem={({ item, index }) => <SpotCard place={item} rank={index + 1} />}
        ListHeaderComponent={
          <Hero
            cat={cat}
            catIdx={catIdx}
            onCat={setCatIdx}
            status={status}
            onLocate={locateAndSearch}
            resultCount={ready && !quotaExceeded ? places.length : null}
            remaining={remaining}
            cacheHit={result?.cacheHit}
            onMap={() =>
              coords && router.push(`/map?lat=${coords.lat}&lng=${coords.lng}`)
            }
          />
        }
        ListEmptyComponent={
          quotaExceeded ? (
            <LimitReached onWatchAd={watchAdForMore} granting={granting} />
          ) : status === "locating" || (ready && isFetching) ? (
            <Skeleton />
          ) : ready ? (
            <Empty />
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Hero({
  cat,
  catIdx,
  onCat,
  status,
  onLocate,
  resultCount,
  remaining,
  cacheHit,
  onMap,
}: {
  cat: (typeof CATEGORIES)[number];
  catIdx: number;
  onCat: (i: number) => void;
  status: Status;
  onLocate: () => void;
  resultCount: number | null;
  remaining: number | null;
  cacheHit?: boolean;
  onMap: () => void;
}) {
  const locating = status === "locating";
  return (
    <View style={{ paddingTop: 20 }}>
      <View style={s.eyebrow}>
        <View style={s.eyebrowDot} />
        <Text style={s.eyebrowText}>DÜRÜST MEKAN KEŞFİ</Text>
      </View>

      <Text style={s.h1}>
        Gözlerini kapat!{"\n"}
        <Text style={s.h1Italic}>Seni harika bir yere götürüyorum.</Text>
      </Text>

      <Text style={s.sub}>
        Algoritmamız sahte puanları temizledi, yapay zekâmız binlerce yorumu senin için
        özetledi. Konumundaki en popüler ve dürüst mekanlar tek tıkla karşında.{" "}
        <Text style={{ color: colors.ink, fontFamily: font.semibold }}>Hadi tıkla da gidelim.</Text>
      </Text>

      {/* kategori filtreleri — yatay kaydırma */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={{ marginHorizontal: -20, marginTop: 22 }}
      >
        {CATEGORIES.map((c, i) => {
          const active = i === catIdx;
          return (
            <Pressable
              key={c.label}
              onPress={() => onCat(i)}
              style={[s.chip, active ? s.chipActive : s.chipIdle]}
            >
              <Text style={[s.chipText, { color: active ? colors.paper : colors.ink }]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* merkezi CTA */}
      <Pressable
        onPress={onLocate}
        disabled={locating}
        style={({ pressed }) => [s.cta, (pressed || locating) && { opacity: 0.75 }]}
      >
        <View style={s.ctaDot} />
        <Text style={s.ctaText}>
          {locating ? "Konumun bulunuyor…" : `Konumumdaki en popüler ${cat.ctaNoun} listele`}
        </Text>
      </Pressable>

      <Text style={s.note}>
        {status === "denied"
          ? "Konuma ulaşamadık — örnek olarak Rotterdam gösteriliyor."
          : "Tek dokunuş. En iyileri RealScore'a göre sıralarız — şişirilmiş puanlar elenir."}
      </Text>

      {/* sonuç başlığı */}
      {resultCount != null && (
        <View style={s.listHead}>
          <Text style={s.listLabel}>
            {cat.key === "all" ? "EN İYİ MEKANLAR" : `EN İYİ ${cat.label.toUpperCase()} MEKANLARI`}
          </Text>
          <Pressable onPress={onMap} hitSlop={8}>
            <Text style={s.mapLink}>
              {remaining != null
                ? `${remaining} keşif kaldı · harita`
                : cacheHit == null
                  ? ""
                  : cacheHit
                    ? "● anlık · harita"
                    : "● güncel · harita"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Skeleton() {
  return (
    <View style={{ marginTop: 4 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={s.skRow}>
          <View style={[s.skBox, { width: 26, height: 18 }]} />
          <View style={{ flex: 1, gap: 9 }}>
            <View style={[s.skBox, { width: "55%", height: 18 }]} />
            <View style={[s.skBox, { width: "35%", height: 12 }]} />
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <View style={[s.skBox, { width: 54, height: 26 }]} />
            <View style={[s.skBox, { width: 60, height: 12 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Empty() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>bu kategoride yakınında mekan bulunamadı</Text>
      <Text style={s.emptyText}>Farklı bir kategori ya da daha geniş bir alan dene.</Text>
    </View>
  );
}

function LimitReached({ onWatchAd, granting }: { onWatchAd: () => void; granting: boolean }) {
  // Kota doldu — maliyet güvenliği (altın kural). Reklamla ödüllendir ya da yarını beklet.
  return (
    <View style={s.limit}>
      <Text style={s.limitTitle}>Bugünlük ücretsiz keşif hakkın doldu</Text>
      <Text style={s.limitText}>
        Kaliteli mekan verisi bize maliyet doğurur; adil kullanım için günlük bir sınır var.
        Kısa bir reklam izleyerek bir keşif daha açabilir ya da yarın devam edebilirsin.
      </Text>
      <Pressable
        onPress={onWatchAd}
        disabled={granting}
        style={({ pressed }) => [s.limitCta, (pressed || granting) && { opacity: 0.75 }]}
      >
        <Text style={s.limitCtaText}>
          {granting ? "hazırlanıyor…" : "Reklam izle → 1 keşif daha"}
        </Text>
      </Pressable>
      <Text style={s.limitNote}>Kota her gün sıfırlanır.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTag: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1.4, color: colors.stone },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.sage },
  eyebrowText: { fontFamily: font.mono, fontSize: 10, letterSpacing: 1.6, color: colors.stone },

  h1: {
    fontFamily: font.display,
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 18,
  },
  h1Italic: { fontFamily: font.displayItalic, color: colors.sage },
  sub: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.stone,
    marginTop: 16,
  },

  chips: { paddingHorizontal: 20, gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  chipActive: { backgroundColor: colors.sage },
  chipIdle: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  chipText: { fontFamily: font.semibold, fontSize: 14 },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 10,
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 22,
    maxWidth: "100%",
  },
  ctaDot: { width: 9, height: 9, borderRadius: 999, backgroundColor: colors.paper },
  ctaText: { fontFamily: font.semibold, fontSize: 15, color: colors.paper, flexShrink: 1 },

  note: { fontFamily: font.regular, fontSize: 12, color: colors.stone, marginTop: 14, maxWidth: 320 },

  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 12,
    marginTop: 30,
  },
  listLabel: { fontFamily: font.mono, fontSize: 11, letterSpacing: 1.4, color: colors.stone },
  mapLink: { fontFamily: font.mono, fontSize: 11, color: colors.sage },

  skRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 18 },
  skBox: { backgroundColor: colors.sand, borderRadius: 6 },

  empty: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: radius.card,
    padding: 28,
    alignItems: "center",
  },
  emptyTitle: { fontFamily: font.mono, fontSize: 14, color: colors.stone },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.stone,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260,
  },

  limit: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.sage,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 28,
    alignItems: "center",
  },
  limitTitle: {
    fontFamily: font.display,
    fontSize: 19,
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  limitText: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.stone,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 300,
  },
  limitCta: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    marginTop: 18,
  },
  limitCtaText: { fontFamily: font.semibold, fontSize: 14, color: colors.paper },
  limitNote: { fontFamily: font.mono, fontSize: 11, color: colors.stone, marginTop: 12 },
});
