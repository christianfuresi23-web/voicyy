import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voicyy",
    short_name: "Voicyy",
    description: "Agenti AI vocali e chatbot su misura.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f5ff69",
    lang: "it",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
