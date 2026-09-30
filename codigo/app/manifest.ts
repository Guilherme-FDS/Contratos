import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wegg — Contratos",
    short_name: "Contratos",
    description: "Medições e títulos a pagar de contratos",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#E8E4D8",
    theme_color: "#003051",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Contratos", url: "/contratos" },
      { name: "Waldemar", url: "/waldemar" },
    ],
  };
}
