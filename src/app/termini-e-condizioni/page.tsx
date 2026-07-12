import type { Metadata } from "next";
import { LegalDocument } from "@/content/legal-document";
import { termsDocument } from "@/content/legal";

export const metadata: Metadata = {
  title: "Termini e Condizioni di Vendita | Voicyy",
  description:
    "Termini e Condizioni di Vendita dei servizi Voicyy per agenti vocali AI e chatbot.",
  alternates: {
    canonical: "/termini-e-condizioni",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return <LegalDocument document={termsDocument} />;
}
