/**
 * Detección de plataforma para la guía de instalación (/instalar).
 *
 * Instalar una PWA es distinto en cada combinación de sistema + navegador, y los pasos no
 * se parecen entre sí: en uno es un botón, en otro un menú Compartir, en otro no se puede.
 * Mandar al cliente a buscar una opción que su navegador no tiene es peor que no decirle nada.
 *
 * Todo esto lee `navigator`, así que solo se puede llamar en el cliente y dentro de un
 * effect: en el servidor no existe el navegador, y calcularlo durante el render rompe la
 * hidratación.
 */

export type Sistema = "ios" | "android" | "escritorio";
export type Navegador = "safari" | "chrome" | "edge" | "firefox" | "otro";

export interface Entorno {
  sistema: Sistema;
  navegador: Navegador;
  /** Ya está instalada y corriendo desde el ícono. */
  instalada: boolean;
  /**
   * Está abierta dentro de otra app (WhatsApp, Instagram, Facebook). Es el caso más
   * frecuente cuando el link llega por mensaje, y es justo donde instalar NO se puede:
   * el navegador embebido de iOS no ofrece "Agregar a inicio" y el de Android no dispara
   * el prompt. Hay que sacar al usuario de ahí antes que nada.
   */
  embebido: boolean;
}

function esStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari iOS no implementa display-mode: standalone; expone este flag propio.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectarSistema(ua: string): Sistema {
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ se presenta como Mac: se lo reconoce por ser táctil.
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (iOSDevice || iPadOS) return "ios";
  if (/android/i.test(ua)) return "android";
  return "escritorio";
}

function detectarNavegador(ua: string, sistema: Sistema): Navegador {
  // En iOS todos los navegadores usan el motor de Safari, pero los menús son distintos:
  // por eso importa distinguirlos aunque por dentro sean lo mismo.
  if (/edg[ei]?\//i.test(ua)) return "edge";
  if (/fxios|firefox/i.test(ua)) return "firefox";
  if (/crios/i.test(ua)) return "chrome";
  if (/chrome|chromium/i.test(ua)) return "chrome";
  if (sistema === "ios" || /safari/i.test(ua)) return "safari";
  return "otro";
}

function detectarEmbebido(ua: string): boolean {
  // WhatsApp no siempre se identifica en el user agent de iOS; el marcador confiable en
  // Android es "; wv)" (WebView). Se suman las redes que abren links en su propia ventana.
  return (
    /\bwv\b|; wv\)/i.test(ua) ||
    /whatsapp/i.test(ua) ||
    /instagram/i.test(ua) ||
    /\bfb(an|av|_iab)\b/i.test(ua) ||
    /line\/|micromessenger/i.test(ua)
  );
}

export function detectarEntorno(): Entorno {
  const ua = window.navigator.userAgent || "";
  const sistema = detectarSistema(ua);

  return {
    sistema,
    navegador: detectarNavegador(ua, sistema),
    instalada: esStandalone(),
    embebido: detectarEmbebido(ua),
  };
}

/**
 * Link que fuerza abrir la página en Chrome desde una app que la tiene embebida.
 * Solo Android: iOS no tiene un equivalente confiable, ahí la salida es manual.
 */
export function linkAbrirEnChrome(href: string): string {
  const url = new URL(href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.android.chrome;end`;
}
