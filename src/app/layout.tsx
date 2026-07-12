import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Voicyy — Agenti AI vocali e chatbot su misura",
    template: "%s | Voicyy",
  },
  description:
    "Agenti AI vocali e chatbot su misura per rispondere, raccogliere richieste e organizzare prenotazioni 24 ore su 24.",
  applicationName: "Voicyy",
  keywords: [
    "agenti AI vocali",
    "chatbot",
    "automazione prenotazioni",
    "segreteria virtuale",
    "Voicyy",
  ],
  authors: [{ name: "Voicyy", url: "mailto:info.voicyy@gmail.com" }],
  creator: "Voicyy",
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Voicyy",
    title: "Voicyy — Ogni chiamata trova una risposta",
    description:
      "Agenti AI vocali e chatbot costruiti intorno alla tua attività.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voicyy — Agenti AI vocali e chatbot su misura",
    description:
      "Automatizza chiamate, raccolta dati e prenotazioni con un agente progettato per la tua attività.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f5ff69",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
