"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (public/sw.js).
 *
 * No aporta funcionalidad visible: está para que Chrome considere la app instalable y
 * dispare `beforeinstallprompt`. Sin service worker registrado, en Android no hay prompt
 * nativo y el botón de instalar no se muestra.
 *
 * Va en el layout raíz para que corra en cualquier pantalla, incluido el login —  que es
 * justo donde llega el cliente por primera vez desde el WhatsApp.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Que falle el registro no puede romper la app: solo significa que este navegador
        // no va a ofrecer instalarla, y la guía de /instalar sigue explicando el camino manual.
      });
  }, []);

  return null;
}
