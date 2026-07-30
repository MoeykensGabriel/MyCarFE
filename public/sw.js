/**
 * Service worker mínimo.
 *
 * Existe por UNA razón concreta: Chrome no ofrece instalar la app (no dispara
 * `beforeinstallprompt`) si el sitio no registra un service worker con manejador de fetch.
 * Sin esto, en Android el botón "Instalar app" no aparece nunca — por más que el manifest
 * esté perfecto.
 *
 * Deliberadamente NO cachea nada de la app. Acá viajan datos de clientes, presupuestos y
 * órdenes: una caché mal invalidada mostraría el presupuesto de otro auto, o uno viejo como
 * si fuera el actual. El único agregado es una pantalla de cortesía cuando el teléfono se
 * queda sin señal en medio de una navegación; todo lo demás pasa derecho a la red.
 */

const SIN_CONEXION = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sin conexión — GB Service</title>
    <style>
      body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
             background:#041627; color:#fff; font-family:system-ui,-apple-system,sans-serif; padding:24px; }
      .caja { max-width:320px; text-align:center; }
      h1 { font-size:20px; margin:0 0 10px; }
      p { font-size:14px; line-height:1.5; color:rgba(255,255,255,.7); margin:0 0 20px; }
      button { background:#fea520; color:#041627; border:0; border-radius:12px;
               padding:12px 20px; font-size:14px; font-weight:800; cursor:pointer; }
    </style>
  </head>
  <body>
    <div class="caja">
      <h1>Sin conexión</h1>
      <p>No pudimos cargar la página. Fijate que tengas señal o wifi y volvé a intentar.</p>
      <button onclick="location.reload()">Reintentar</button>
    </div>
  </body>
</html>`;

self.addEventListener("install", () => {
  // Toma el control apenas se instala: sin esto la primera visita se queda sin service
  // worker activo y Chrome no considera la app instalable hasta recargar.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Solo navegaciones. Las llamadas a la API y los assets pasan sin tocar: que este archivo
  // no pueda servir datos viejos es una decisión, no un olvido.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(SIN_CONEXION, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    ),
  );
});
