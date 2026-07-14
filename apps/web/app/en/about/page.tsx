import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";
import { alternates, getDict } from "@/lib/i18n";

const t = getDict("en");

export const metadata: Metadata = {
  title: t.meta.aboutTitle,
  description: t.meta.aboutDescription,
  alternates: { ...alternates("about"), canonical: "/en/about" },
};

export default function Page() {
  return <AboutPage locale="en" />;
}
