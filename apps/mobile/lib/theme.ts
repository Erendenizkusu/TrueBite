// TrueBite mobil tasarım belirteçleri — web ile aynı "Ölçülmüş dürüstlük" dili.

export const colors = {
  paper: "#F4F2EC",
  surface: "#FAF9F5",
  ink: "#15140F",
  ember: "#FF4A1C",
  emberSoft: "#FFE7DF",
  pine: "#0F5C46",
  pineSoft: "#DCEBE2",
  sand: "#E7E3D8",
  stone: "#76726A",
  line: "#DDD9CD",
} as const;

// @expo-google-fonts dışa aktarım adlarıyla birebir eşleşir (useFonts ile yüklenir).
export const font = {
  regular: "HankenGrotesk_400Regular",
  medium: "HankenGrotesk_500Medium",
  semibold: "HankenGrotesk_600SemiBold",
  bold: "HankenGrotesk_700Bold",
  extrabold: "HankenGrotesk_800ExtraBold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
} as const;

export const radius = { pill: 999, card: 18 } as const;
