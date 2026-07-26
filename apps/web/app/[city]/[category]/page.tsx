import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "@/components/guide/GuidePage";
import { loadGuide } from "@/lib/server/guideData";

// ISR: sayfa ilk ziyarette üretilir, 1 gün cache'lenir. runNearby zaten 10 gün DB cache
// tuttuğu için ziyaret/yenileme başına Google'a GİTMEZ (altın kural). generateStaticParams
// YOK → next build sırasında hiçbir Google çağrısı yapılmaz.
export const revalidate = 86400;

type Params = { params: Promise<{ city: string; category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city, category } = await params;
  const data = await loadGuide("tr", city, category);
  if (!data) return {};
  return {
    title: data.meta.title,
    description: data.meta.description,
    alternates: {
      canonical: data.meta.canonical,
      languages: { tr: data.meta.languages.tr, en: data.meta.languages.en, "x-default": data.meta.languages.tr },
    },
    openGraph: { title: data.meta.title, description: data.meta.description, type: "article" },
  };
}

export default async function CityCategoryPage({ params }: Params) {
  const { city, category } = await params;
  const data = await loadGuide("tr", city, category);
  if (!data) notFound();

  return (
    <GuidePage
      locale="tr"
      city={data.city}
      places={data.places}
      content={data.content}
      altHref={data.altHref}
      homeHref={data.homeHref}
      aboutHref={data.aboutHref}
      ctaHref={data.ctaHref}
      otherCategories={data.otherCategories}
      otherCities={data.otherCities}
    />
  );
}
