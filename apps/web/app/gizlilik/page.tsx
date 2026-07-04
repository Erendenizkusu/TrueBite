import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Volicious",
  description:
    "Volicious hangi verileri işler, neden işler ve hangi üçüncü taraflarla (Google Places, AdSense, AdMob) paylaşır — açık ve sade.",
};

// AdSense onayı + yasal uyum için zorunlu. Uygulamanın gerçekte yaptığını dürüstçe anlatır:
// konum → yakındaki mekan, rastgele cihaz kimliği → adil kullanım kotası, reklam çerezleri.
export default function GizlilikPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.18em] text-sage hover:underline">
        ← Volicious
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">
        Gizlilik Politikası
      </h1>
      <p className="mt-2 font-mono text-xs text-stone">Son güncelleme: 4 Temmuz 2026</p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink/90">
        <section>
          <p>
            Volicious (&quot;biz&quot;), konumuna en yakın gerçekten en iyi mekanları gösteren bir
            keşif hizmetidir. Amacımız az veriyle çok değer sunmak; topladığımız her veri, hizmetin
            çalışması için gereken en az veridir. Bu politika neyi neden işlediğimizi sade dille anlatır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">İşlediğimiz veriler</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-stone">
            <li>
              <strong className="text-ink">Yaklaşık konum:</strong> Yakınındaki mekanları bulmak için
              tarayıcının/cihazın konumunu <em>yalnızca sen &quot;listele&quot;ye bastığında</em>
              alırız. Konum, mekan aramasını yapmak için kullanılır; kalıcı olarak profilinle
              eşleştirilmez.
            </li>
            <li>
              <strong className="text-ink">Rastgele cihaz kimliği:</strong> Adil kullanım / günlük
              ücretsiz keşif kotası için cihazında rastgele bir kimlik saklanır (tarayıcı deposu). Bu
              kimlik seni şahsen tanımlamaz; kimliğinle, adınla veya e-postanla ilişkilendirilmez.
            </li>
            <li>
              <strong className="text-ink">Teknik kayıtlar:</strong> Hizmeti güvenli ve çalışır tutmak
              için standart sunucu kayıtları (istek zamanı, hata bilgisi) geçici olarak tutulabilir.
            </li>
          </ul>
          <p className="mt-3 text-stone">
            Hesap oluşturmuyoruz; ad, e-posta veya telefon <strong className="text-ink">toplamıyoruz</strong>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Üçüncü taraf hizmetler</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-stone">
            <li>
              <strong className="text-ink">Google Places:</strong> Mekan bilgisi (isim, puan, yorum
              sayısı) Google Places API&apos;den alınır. Aramayı yapmak için konumun bu servise
              iletilir.
            </li>
            <li>
              <strong className="text-ink">Google AdSense (web):</strong> Web sitesinde reklam
              göstermek için Google AdSense kullanılabilir. AdSense ve iş ortakları, ilgili reklamlar
              sunmak için çerezleri ve benzeri teknolojileri kullanabilir. Reklam kişiselleştirmesini
              Google Reklam Ayarları&apos;ndan yönetebilirsin.
            </li>
            <li>
              <strong className="text-ink">Google AdMob (mobil):</strong> Mobil uygulamada ödüllü
              reklamlar AdMob ile sunulur; benzer reklam teknolojileri geçerlidir.
            </li>
            <li>
              <strong className="text-ink">OpenAI:</strong> Bir mekanın öne çıkan özelliklerini
              özetlemek için <em>herkese açık</em> yorum metinleri geçici olarak işlenir; bu işlemde
              kişisel verin gönderilmez.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Çerezler ve reklamlar</h2>
          <p className="mt-3 text-stone">
            Reklam sağlayıcıları (Google dâhil) reklamları sunmak ve ölçmek için çerez kullanabilir.
            Avrupa Ekonomik Alanı / Birleşik Krallık kullanıcıları için, gerektiğinde bir rıza yönetim
            mekanizması aracılığıyla onayın istenir. Tarayıcı ayarlarından çerezleri sınırlayabilirsin;
            bu durumda reklamlar daha az ilgili olabilir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Paylaşım ve saklama</h2>
          <p className="mt-3 text-stone">
            Verini <strong className="text-ink">satmayız</strong>. Yalnızca hizmeti sağlamak için
            gereken üçüncü taraflarla (yukarıdakiler) paylaşılır. Verileri, amacı için gereken süre
            kadar tutarız.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Haklarımız</h2>
          <p className="mt-3 text-stone">
            KVKK ve GDPR kapsamında verilerine erişme, düzeltme ve silinmesini talep etme haklarına
            sahipsin. Talebini aşağıdaki iletişim adresine iletebilirsin.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold tracking-[-0.01em]">İletişim</h2>
          <p className="mt-3 text-stone">
            Sorular için: <span className="text-ink">iletisim@volicious.app</span>
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.18em] text-sage hover:underline">
          ← Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
