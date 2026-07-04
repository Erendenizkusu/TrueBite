import { Text, View } from "react-native";
import { colors, font } from "@/lib/theme";

export function Brand({ size = 19 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text style={{ fontFamily: font.extrabold, fontSize: size, color: colors.ink, letterSpacing: -0.6 }}>
        Volicious
      </Text>
      <Text style={{ fontFamily: font.extrabold, fontSize: size, color: colors.sage }}>.</Text>
    </View>
  );
}
