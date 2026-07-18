import type { MetadataRoute } from "next";

/**
 * Web App Manifest — requisito para que Android/Chrome ofrezca instalar la app
 * (sin esto, `beforeinstallprompt` nunca dispara). Next lo sirve en /manifest.webmanifest
 * y lo linkea automáticamente en el <head>.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GB Service",
    short_name: "GB Service",
    description: "Sistema de gestión de taller mecánico",
    start_url: "/",
    display: "standalone",
    background_color: "#041627",
    theme_color: "#041627",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Maskable: Android lo recorta en círculo/squircle — versión con más padding
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
