/**
 * Resuelve URLs de assets (fotos, archivos) que el backend devuelve como rutas relativas
 * tipo "/uploads/...". El backend está en otro dominio (Railway) que el frontend (Vercel),
 * así que el navegador no puede resolverlas solo.
 *
 * Uso:
 *   <img src={resolveAssetUrl(photo.url)} />
 *
 * - Si la URL ya es absoluta (http:// o https://), se devuelve sin tocar.
 * - Si arranca con /, se prefijea con NEXT_PUBLIC_API_URL.
 * - Si es vacía/null/undefined, devuelve "".
 */
export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!base) return url; // fallback razonable

  return `${base.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}
