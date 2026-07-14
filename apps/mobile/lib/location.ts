import { Linking, Platform } from "react-native";
import * as Location from "expo-location";

/**
 * Konum edinme — engelin TÜRÜNÜ ayırt eder. Kritik: "uygulama izni yok" ile "cihazın konum
 * servisi (GPS) kapalı" FARKLI sorunlardır ve farklı çözümleri vardır:
 *   - izin yok            → izin iste / uygulama ayarları
 *   - konum servisi kapalı → izin vermek İŞE YARAMAZ; sistem konum ayarları açılmalı
 * İkisini tek "reddedildi" kovasına atmak kullanıcıyı çıkmaza sokar (kullanıcı geri bildirimi).
 */
export type Blocker =
  | "services" // cihazın konum servisi kapalı (GPS/konum toggle)
  | "permission" // izin verilmemiş ama tekrar sorabiliriz
  | "permission-blocked" // izin kalıcı reddedilmiş → yalnızca uygulama ayarlarından açılır
  | "unavailable"; // sinyal yok / zaman aşımı / bilinmeyen

export type LocateResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; blocker: Blocker };

/** Cihazın konum servisi (sistem seviyesi GPS toggle) açık mı? */
export async function servicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return true; // kontrol edilemiyorsa akışı kilitleme; asıl deneme zaten hatayı yakalar
  }
}

/** Konumu al; başarısızsa NEDENİ döner (çağıran doğru ekranı gösterebilsin diye). */
export async function locate(): Promise<LocateResult> {
  // 1) Önce cihaz servisi: kapalıyken izin istemek anlamsız (izin verilse de konum gelmez).
  if (!(await servicesEnabled())) return { ok: false, blocker: "services" };

  // 2) Uygulama izni.
  let perm;
  try {
    perm = await Location.requestForegroundPermissionsAsync();
  } catch {
    return { ok: false, blocker: "permission" };
  }
  if (!perm.granted) {
    return { ok: false, blocker: perm.canAskAgain ? "permission" : "permission-blocked" };
  }

  // 3) Konumu oku.
  //    - Balanced hassasiyet: uydu kilidi beklemez (ağ konumu yeter — zaten 4 km yarıçapta ararız).
  //    - Zaman aşımı: GPS yavaşsa kullanıcıyı süresiz "aranıyor…" ekranında bırakmayız.
  //    - Zaman aşımında son bilinen konuma düşeriz; o da yoksa "unavailable" deriz.
  try {
    const pos = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      GPS_TIMEOUT_MS,
    );
    if (pos) return { ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude };

    const last = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });
    if (last) return { ok: true, lat: last.coords.latitude, lng: last.coords.longitude };

    return { ok: false, blocker: (await servicesEnabled()) ? "unavailable" : "services" };
  } catch {
    return { ok: false, blocker: (await servicesEnabled()) ? "unavailable" : "services" };
  }
}

const GPS_TIMEOUT_MS = 15_000;
const LAST_KNOWN_MAX_AGE_MS = 5 * 60_000;

/** Söz verilen sürede bitmezse null döner (expo-location'ın kendi timeout seçeneği yok). */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Sistem KONUM ayarları ekranını açar.
 * Android: doğrudan konum ayarları sayfasına gider (Linking.sendIntent — RN çekirdeğinde var,
 *   ek native paket/build değişikliği gerekmez).
 * iOS: konum servisleri toggle'ına deep-link YOKTUR (Apple izin vermez) → uygulama ayarları
 *   açılır; kullanıcıya metinde manuel yol gösterilir.
 */
export async function openLocationSettings(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
      return;
    }
    await Linking.openSettings();
  } catch {
    // Ayar ekranı açılamazsa sessiz geç — UI'da manuel yol zaten yazılı.
  }
}

/** Uygulamanın ayar sayfasını açar (kalıcı reddedilen izni buradan açtırırız). */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    /* UI'da manuel yol yazılı */
  }
}
