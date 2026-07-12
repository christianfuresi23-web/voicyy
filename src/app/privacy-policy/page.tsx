import type { Metadata } from "next";
import { LegalDocument } from "@/content/legal-document";
import { privacyDocument } from "@/content/legal";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy | Voicyy",
  description:
    "Informativa sul trattamento dei dati personali raccolti da Voicyy ai sensi del GDPR.",
  alternates: {
    canonical: "/privacy-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return <LegalDocument document={privacyDocument} />;
}
