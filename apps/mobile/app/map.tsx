import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchNearby } from "@/lib/api";
import { colors, font } from "@/lib/theme";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lat, lng } = useLocalSearchParams<{ lat: string; lng: string }>();
  const latN = Number(lat);
  const lngN = Number(lng);

  const { data } = useQuery({
    queryKey: ["nearby", latN, lngN],
    queryFn: () => fetchNearby(latN, lngN),
    enabled: Number.isFinite(latN) && Number.isFinite(lngN),
  });
  const places = data?.kind === "ok" ? data.result.places : [];

  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: Number.isFinite(latN) ? latN : 41,
          longitude: Number.isFinite(lngN) ? lngN : 29,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {places.map((p, i) => (
          <Marker
            key={p.placeId}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={`${i + 1}. ${p.name}`}
            description={`RealScore ${p.realScore.toFixed(2)} · ${p.userRatingsTotal} yorum`}
            pinColor={i === 0 ? colors.ember : undefined}
          />
        ))}
      </MapView>

      <Pressable style={[s.back, { top: insets.top + 12 }]} onPress={() => router.back()}>
        <Text style={s.backText}>‹ liste</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  back: {
    position: "absolute",
    left: 16,
    backgroundColor: colors.paper,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.line,
  },
  backText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
});
