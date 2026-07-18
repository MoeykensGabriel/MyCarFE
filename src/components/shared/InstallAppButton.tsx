"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

/**
 * Botón "Instalar app" (PWA) — mismo comportamiento que en GestionPGB:
 *  - Android / Chrome / Edge: dispara el prompt nativo de instalación.
 *  - iPhone / iPad (Safari): abre instrucciones (Compartir → Agregar a inicio),
 *    porque iOS no expone prompt programático.
 *  - Oculto si la app ya corre instalada (standalone) o si el navegador no
 *    ofrece ninguna vía de instalación.
 *
 * Variantes visuales:
 *  - "sidebar": fila de menú para los sidebars oscuros (admin / recepción).
 *  - "header": botón compacto para los headers oscuros (mecánico / cliente).
 */

// beforeinstallprompt no está en los tipos estándar del DOM
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari iOS expone navigator.standalone (no tipado)
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ se presenta como Mac con pantalla táctil
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export function InstallAppButton({ variant = "sidebar" }: { variant?: "sidebar" | "header" }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    // Todo en effect: evita mismatch de hidratación (SSR no conoce el navegador)
    setInstalled(isStandalone());
    setIos(detectIOS());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferred && !ios) return null;

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch {
        // usuario cerró el diálogo nativo
      }
      setDeferred(null);
    } else if (ios) {
      setShowIosHelp(true);
    }
  };

  return (
    <>
      {variant === "sidebar" ? (
        <button
          onClick={handleClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Download className="w-4 h-4 shrink-0" />
          Instalar app
        </button>
      ) : (
        <button
          onClick={handleClick}
          aria-label="Instalar app"
          title="Instalar app"
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Download className="w-4.5 h-4.5" />
        </button>
      )}

      {/* Instrucciones iOS — bottom sheet en mobile */}
      {showIosHelp && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIosHelp(false);
          }}
        >
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c4c6cd]/60">
              <h2 className="text-base font-bold text-[#041627]">Instalar en tu iPhone</h2>
              <button
                onClick={() => setShowIosHelp(false)}
                className="p-1.5 rounded-md text-[#44474c] hover:bg-[#eefcfd]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#eefcfd] border border-[#c4c6cd]/60 flex items-center justify-center text-xs font-bold text-[#041627] shrink-0">
                  1
                </span>
                <p className="text-sm text-[#041627] leading-relaxed">
                  Tocá el botón <strong>Compartir</strong>{" "}
                  <Share className="inline w-4 h-4 text-[#fea520] -mt-0.5" /> en la barra de Safari.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#eefcfd] border border-[#c4c6cd]/60 flex items-center justify-center text-xs font-bold text-[#041627] shrink-0">
                  2
                </span>
                <p className="text-sm text-[#041627] leading-relaxed">
                  Elegí <strong>&ldquo;Agregar a inicio&rdquo;</strong>{" "}
                  <SquarePlus className="inline w-4 h-4 text-[#fea520] -mt-0.5" /> en la lista.
                </p>
              </div>
              <p className="text-xs text-[#44474c]/70 leading-relaxed">
                La app queda en tu pantalla de inicio y se abre a pantalla completa, como una app
                más.
              </p>
              <button
                onClick={() => setShowIosHelp(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#fea520] text-[#041627] hover:bg-[#e8951d] transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
