import type { Metadata } from "next";
import { PrivacyPage } from "@/components/PrivacyPage";
import { alternates, getDict } from "@/lib/i18n";

const t = getDict("en");

export const metadata: Metadata = {
  title: t.meta.privacyTitle,
  description: t.meta.privacyDescription,
  alternates: { ...alternates("privacy"), canonical: "/en/privacy" },
};

export default function Page() {
  return <PrivacyPage locale="en" />;
}
