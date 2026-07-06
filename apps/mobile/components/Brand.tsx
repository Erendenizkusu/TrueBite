import { Text, View } from "react-native";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";
import { colors, font } from "@/lib/theme";

/**
 * V-pin marka işareti — web (components/Mark.tsx) ile birebir aynı yollar:
 * V harfi = aşağıyı gösteren konum pini + sol kolda çatal dişleri + sağ kolda bıçak ağzı,
 * dibinde sage konum noktası (+ gölge). "currentColor" yerine koyu-tema ink (krem).
 */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 122) / 120} viewBox="0 0 120 122">
      <Path
        fillRule="evenodd"
        fill={colors.ink}
        d="M18 24 L44 24 L60 60 L76 24 L90 23 Q100 22 98 36 L60 96 Z M23.5 21 L26.3 21 L26.3 40 L23.5 40 Z M30 21 L32.8 21 L32.8 40 L30 40 Z M36.5 21 L39.3 21 L39.3 40 L36.5 40 Z"
      />
      <Path d="M86 31 L62 86" stroke="rgba(255,255,255,0.30)" strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M42 58 L60 63 L78 58 L60 96 Z" fill="#000000" opacity={0.16} />
      <Ellipse cx={60} cy={113} rx={18} ry={3.8} fill="#000000" opacity={0.15} />
      <Circle cx={60} cy={109.5} r={4.6} fill="#8C965E" />
    </Svg>
  );
}

/** Header markası: V-pin işareti + VOLICIOUS wordmark (büyük harf, harf-aralıklı, sage V). */
export function Brand({ size = 19 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Mark size={size + 7} />
      <Text
        style={{
          fontFamily: font.extrabold,
          fontSize: size,
          letterSpacing: size * 0.14,
          color: colors.ink,
        }}
      >
        <Text style={{ color: colors.sage }}>V</Text>OLICIOUS
      </Text>
    </View>
  );
}
