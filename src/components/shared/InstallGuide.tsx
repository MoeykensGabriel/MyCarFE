"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  MoreVertical,
  Share,
  SquarePlus,
  Star,
  Wrench,
} from "lucide-react";

import { detectarEntorno, linkAbrirEnChrome, type Entorno } from "@/lib/install-platform";

// beforeinstallprompt no está en los tipos estándar del DOM
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Guía para dejar la app en la pantalla de inicio.
 *
 * Muestra UN camino: el que corresponde al teléfono y al navegador que tiene el usuario
 * delante. Ofrecerle los cuatro y que elija es pedirle que resuelva él lo que el sistema
 * puede averiguar solo.
 *
 * El caso que manda es el navegador embebido (WhatsApp): es por donde llega el cliente, y
 * es el único donde instalar no se puede. Ahí la guía no explica cómo instalar — explica
 * cómo salir a un navegador de verdad, que es el paso que falta.
 */
export function InstallGuide() {
  const [entorno, setEntorno] = useState<Entorno | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [href, setHref] = useState("");

  useEffect(() => {
    // Todo en effect: el servidor no conoce el navegador y calcularlo en el render
    // rompería la hidratación.
    setEntorno(detectarEntorno());
    setHref(window.location.href);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setEntorno((prev) => (prev ? { ...prev, instalada: true } : prev));
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const instalarNativo = async () => {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // el usuario cerró el diálogo del navegador
    }
    setDeferred(null);
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copiá el link:", href);
    }
  };

  // Primer render (y SSR): sin detección todavía. Un cartel neutro evita el parpadeo de
  // mostrar los pasos de una plataforma y cambiarlos un instante después.
  if (!entorno) {
    return (
      <Tarjeta>
        <p className="text-sm text-[#44474c]">Detectando tu dispositivo...</p>
      </Tarjeta>
    );
  }

  if (entorno.instalada) {
    return (
      <Tarjeta>
        <Encabezado
          titulo="Ya la tenés instalada"
          bajada="Estás usando la app desde tu pantalla de inicio. No hay nada más que hacer."
        />
        <div className="flex items-center gap-2 rounded-xl bg-[#eefcfd] border border-[#c4c6cd]/60 px-4 py-3">
          <Check className="w-4 h-4 text-[#041627] shrink-0" />
          <p className="text-sm text-[#041627]">Buscá el ícono de GB Service entre tus apps.</p>
        </div>
      </Tarjeta>
    );
  }

  // ── Adentro de WhatsApp / Instagram / Facebook ────────────────────────────
  // Antes que nada, salir. Explicar cómo instalar acá sería mandarlo a buscar un botón
  // que ese navegador no tiene.
  if (entorno.embebido) {
    return (
      <Tarjeta>
        <Encabezado
          titulo="Abrí este link en tu navegador"
          bajada="Estás viendo la página dentro de otra app, y desde acá el teléfono no deja instalarla. Es un paso y seguimos."
        />

        {entorno.sistema === "android" ? (
          <>
            <a
              href={linkAbrirEnChrome(href)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black bg-[#fea520] text-[#041627] hover:bg-[#e8951d] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en Chrome
            </a>
            <Paso n={1}>
              Si el botón no hace nada, tocá <Icono icon={MoreVertical} /> arriba a la derecha
              y elegí <strong>&ldquo;Abrir en el navegador&rdquo;</strong>.
            </Paso>
          </>
        ) : (
          <>
            <Paso n={1}>
              Tocá el ícono de <strong>Safari</strong> <Icono icon={ExternalLink} /> abajo a la
              derecha de esta pantalla. Si no lo ves, usá el botón de acá abajo para copiar el
              link y pegalo en Safari.
            </Paso>
            <button
              onClick={copiarLink}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black bg-[#041627] text-white hover:bg-[#0a2740] transition-all"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiado ? "Link copiado" : "Copiar el link"}
            </button>
          </>
        )}

        <p className="text-xs text-[#44474c]/70 leading-relaxed">
          Ya en el navegador, volvé a esta misma página y te vamos a mostrar el paso que falta.
        </p>
      </Tarjeta>
    );
  }

  // ── Android ───────────────────────────────────────────────────────────────
  if (entorno.sistema === "android") {
    return (
      <Tarjeta>
        <Encabezado
          titulo="Instalar en tu Android"
          bajada="Queda como una app más: ícono propio y pantalla completa, sin la barra del navegador."
        />
        {deferred ? (
          <button
            onClick={instalarNativo}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black bg-[#fea520] text-[#041627] hover:bg-[#e8951d] transition-all"
          >
            <Download className="w-4 h-4" />
            Instalar app
          </button>
        ) : (
          <>
            <Paso n={1}>
              Tocá <Icono icon={MoreVertical} /> arriba a la derecha, en la barra del navegador.
            </Paso>
            <Paso n={2}>
              Elegí <strong>&ldquo;Instalar app&rdquo;</strong> o{" "}
              <strong>&ldquo;Agregar a pantalla principal&rdquo;</strong>.
            </Paso>
          </>
        )}
      </Tarjeta>
    );
  }

  // ── iPhone / iPad ─────────────────────────────────────────────────────────
  // Apple no expone ningún prompt: siempre es a mano. Lo único que cambia es dónde está
  // el botón Compartir según el navegador.
  if (entorno.sistema === "ios") {
    const enSafari = entorno.navegador === "safari";
    return (
      <Tarjeta>
        <Encabezado
          titulo="Instalar en tu iPhone"
          bajada="Son dos toques. Queda con ícono propio y se abre a pantalla completa."
        />
        <Paso n={1}>
          Tocá <strong>Compartir</strong> <Icono icon={Share} />
          {enSafari
            ? " en la barra de abajo de Safari."
            : ` en el menú de ${entorno.navegador === "chrome" ? "Chrome" : "tu navegador"}.`}
        </Paso>
        <Paso n={2}>
          Deslizá la lista y elegí <strong>&ldquo;Agregar a inicio&rdquo;</strong>{" "}
          <Icono icon={SquarePlus} />.
        </Paso>
        {!enSafari && (
          <p className="text-xs text-[#44474c]/70 leading-relaxed">
            Si no encontrás esa opción, abrí esta misma página en <strong>Safari</strong>: ahí
            está siempre.
          </p>
        )}
      </Tarjeta>
    );
  }

  // ── Escritorio ────────────────────────────────────────────────────────────
  if (entorno.navegador === "firefox") {
    return (
      <Tarjeta>
        <Encabezado
          titulo="Firefox no instala aplicaciones web"
          bajada="No es algo que falte configurar: Firefox de escritorio no ofrece instalarlas."
        />
        <Paso n={1}>
          Guardala en <strong>Marcadores</strong> <Icono icon={Star} /> con Ctrl+D para tenerla
          a un clic.
        </Paso>
        <Paso n={2}>
          Si querés el ícono propio, abrila en <strong>Chrome</strong> o{" "}
          <strong>Edge</strong> y volvé a esta página.
        </Paso>
      </Tarjeta>
    );
  }

  if (entorno.navegador === "safari") {
    return (
      <Tarjeta>
        <Encabezado
          titulo="Instalar en tu Mac"
          bajada="Queda en el Dock y se abre en su propia ventana."
        />
        <Paso n={1}>
          Tocá <strong>Compartir</strong> <Icono icon={Share} /> en la barra de Safari.
        </Paso>
        <Paso n={2}>
          Elegí <strong>&ldquo;Agregar al Dock&rdquo;</strong>.
        </Paso>
        <p className="text-xs text-[#44474c]/70 leading-relaxed">
          Disponible en macOS Sonoma en adelante. En versiones anteriores, usá Chrome o Edge.
        </p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <Encabezado
        titulo="Instalar en tu computadora"
        bajada="Queda como una aplicación: ícono propio y ventana sin barra de navegador."
      />
      {deferred ? (
        <button
          onClick={instalarNativo}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black bg-[#fea520] text-[#041627] hover:bg-[#e8951d] transition-all"
        >
          <Download className="w-4 h-4" />
          Instalar app
        </button>
      ) : (
        <>
          <Paso n={1}>
            Buscá el ícono de instalar <Icono icon={Download} /> a la derecha de la barra de
            direcciones.
          </Paso>
          <Paso n={2}>
            O entrá al menú del navegador y elegí <strong>&ldquo;Instalar GB Service&rdquo;</strong>.
          </Paso>
        </>
      )}
    </Tarjeta>
  );
}

// ─── Piezas visuales ──────────────────────────────────────────────────────────

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
      <div className="relative h-1.5 w-full bg-[#fea520]">
        <div className="absolute inset-0 bg-[#fea520] blur-sm opacity-60" />
      </div>
      <div className="px-6 sm:px-8 py-8 space-y-4">
        <div className="flex flex-col items-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-[#041627] flex items-center justify-center shadow-lg ring-4 ring-[#041627]/10">
            <Wrench className="w-7 h-7 text-[#fea520]" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Encabezado({ titulo, bajada }: { titulo: string; bajada: string }) {
  return (
    <div className="text-center pb-2">
      <h1 className="text-xl font-bold text-[#041627]">{titulo}</h1>
      <p className="text-sm text-[#44474c] mt-1.5 leading-relaxed">{bajada}</p>
    </div>
  );
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-full bg-[#eefcfd] border border-[#c4c6cd]/60 flex items-center justify-center text-xs font-bold text-[#041627] shrink-0">
        {n}
      </span>
      <p className="text-sm text-[#041627] leading-relaxed">{children}</p>
    </div>
  );
}

function Icono({ icon: Icon }: { icon: typeof Share }) {
  return <Icon className="inline w-4 h-4 text-[#fea520] -mt-0.5" />;
}
