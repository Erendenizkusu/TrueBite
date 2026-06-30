# @truebite/mobile

TrueBite mobil uygulaması — **Expo + React Native + Expo Router + TanStack Query**. Web ile aynı
backend'i (`/places/nearby`) ve aynı "Ölçülmüş dürüstlük" tasarım dilini paylaşır.

## Konum-bağımsız (önemli)

Uygulama **GPS-öncelikli** açılır — sabit şehir yoktur. Cihazın konumunu alır ve o bölgeyi
sorgular (İstanbul, Rotterdam, herhangi bir yer). Konum izni reddedilirse örnek olarak Rotterdam
gösterilir. RealScore her bölgenin kendi taban çizgisine göre kalibre olur.

## Ekranlar

- `app/index.tsx` — keşif: GPS → `/places/nearby` → `SpotCard` listesi (RealScore rozetleriyle).
- `app/map.tsx` — `react-native-maps` ile pin'li harita (#1 ember).

İmza bileşen `RealScoreBadge`: ham Google puanının nasıl düzeltildiğini gösterir.

## Kurulum & çalıştırma

```bash
# 1) Bağımlılıkları Expo ile hizala (sürüm uyumu için önerilir)
npx expo install

# 2) Backend adresini ayarla — cihaz/emülatör 'localhost'a erişemez:
#    Android emülatör:  EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8787
#    Fiziksel cihaz:    EXPO_PUBLIC_API_BASE_URL=http://<dev-makine-LAN-IP>:8787
echo "EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8787" > .env

# 3) Başlat
npx expo start
```

### Harita anahtarı

`app.json` → `android.config.googleMaps.apiKey` alanına **Maps SDK for Android** anahtarını gir.
iOS varsayılan olarak Apple Maps kullanır (anahtar gerekmez). Harita için development build
gerekir (`npx expo run:android` / `run:ios`) — Expo Go `react-native-maps`'i sınırlı destekler.

## Backend gereksinimi

`@truebite/api` ayakta olmalı ve gerçek mekanlar için `GOOGLE_PLACES_API_KEY` tanımlı olmalı.
Anahtar yokken yalnızca seed'li bölge (Kadıköy) veri döner; diğer konumlar boş-durum gösterir.

## Not

`@truebite/shared`'dan yalnızca **tip** import edilir (runtime'da silinir → Metro paketlemez).
Görsel format yardımcıları (`lib/format.ts`) yereldir ve `node --test lib/format.test.ts` ile
doğrulanır; çekirdek RealScore mantığı DB + `@truebite/scoring`'de tek kaynaktır.
