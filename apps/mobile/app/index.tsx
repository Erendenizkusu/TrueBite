import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { ScoredPlace } from "@truebite/shared";
import { fetchNearby } from "@/lib/api";
import { colors, font } from "@/lib/theme";
import { Brand } from "@/components/Brand";
import { SpotCard } from "@/components/SpotCard";

// KONUM-BAĞIMSIZ: GPS-öncelikli. İzin yoksa fallback Rotterdam — her yerde çalışır.
const FALLBACK = { lat: 51.9225, lng: 4.4792, label: "Rotterdam" };

type Coords = { lat: number; lng: number; label: string };

export default function Discover() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setDenied(true);
          setCoords(FALLBACK);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Konumun" });
      } catch {
        setDenied(true);
        setCoords(FALLBACK);
      }
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["nearby", coords?.lat, coords?.lng],
    queryFn: () => fetchNearby(coords!.lat, coords!.lng),
    enabled: !!coords,
  });
  const places = data?.places ?? [];

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.paper }}>
      <View style={s.header}>
        <Brand />
        <Pressable
          style={s.mapBtn}
          onPress={() => coords && router.push(`/map?lat=${coords.lat}&lng=${coords.lng}`)}
        >
          <View style={s.dotEmber} />
          <Text style={s.mapBtnText}>harita</Text>
        </Pressable>
      </View>

      <FlatList
        data={places}
        keyExtractor={(p: ScoredPlace) => p.placeId}
        renderItem={({ item, index }) => <SpotCard place={item} rank={index + 1} />}
        ListHeaderComponent={
          <Hero
            count={places.length}
            label={coords?.label ?? "…"}
            cacheHit={data?.cacheHit}
            denied={denied}
          />
        }
        ListEmptyComponent={isLoading || !coords ? <Loading /> : <Empty />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Hero({
  count,
  label,
  cacheHit,
  denied,
}: {
  count: number;
  label: string;
  cacheHit?: boolean;
  denied: boolean;
}) {
  const tag = cacheHit == null ? "" : cacheHit ? " · ÖNBELLEK" : " · CANLI";
  return (
    <View style={{ paddingTop: 16, paddingBottom: 8 }}>
      <Text style={s.eyebrow}>
        {label.toUpperCase()} · {count} MEKAN{tag}
      </Text>
      <Text style={s.h1}>
        Sahte yorumlar değil,{"\n"}
        <Text style={{ color: colors.ember }}>gerçekten</Text> en iyiler.
      </Text>
      <Text style={s.sub}>
        Az yorumlu şişirilmiş puanları eleyen RealScore ile, konumundaki en iyi mekanlar.
      </Text>
      {denied && (
        <Text style={s.note}>Konum izni yok — örnek olarak Rotterdam gösteriliyor.</Text>
      )}
      <Text style={s.listLabel}>REALSCORE SIRALAMASI</Text>
    </View>
  );
}

function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.ember} />
    </View>
  );
}

function Empty() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>bu bölge için henüz veri yok</Text>
      <Text style={s.emptyText}>
        Google Places anahtarı bağlanınca bu konum ilk sorguda otomatik dolacak.
      </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  dotEmber: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.ember },
  mapBtnText: { fontFamily: font.medium, fontSize: 13, color: colors.ink },
  eyebrow: { fontFamily: font.mono, fontSize: 11, letterSpacing: 1.6, color: colors.stone },
  h1: {
    fontFamily: font.extrabold,
    fontSize: 34,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -1,
    marginTop: 14,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.stone,
    marginTop: 14,
    maxWidth: 340,
  },
  note: { fontFamily: font.medium, fontSize: 12, color: colors.ember, marginTop: 12 },
  listLabel: {
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.stone,
    marginTop: 26,
  },
  center: { paddingVertical: 60, alignItems: "center" },
  empty: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: 18,
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
});
