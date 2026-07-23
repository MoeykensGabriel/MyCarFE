"use client";

interface DetailSheetProps {
  /** Cierra el panel. En mobile también se dispara al tocar el fondo oscurecido. */
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Envoltorio de los paneles de detalle de los listados del admin (clientes,
 * vehículos, flotas, recepcionistas, mecánicos).
 *
 * - **Desktop (lg+):** columna lateral de 320px, sticky al scrollear la lista.
 * - **Mobile:** bottom-sheet emergente sobre el listado, con fondo oscurecido.
 *
 * El bottom-sheet no es un capricho estético: estos paneles se renderizan DESPUÉS
 * de la columna de la lista, así que apilados en `flex-col` quedaban al final de
 * todo — abajo de las cards, del contador y de la paginación. Tocabas un ítem y
 * parecía que no pasaba nada porque el panel se abría fuera de la pantalla.
 *
 * El panel de adentro pone su propio header, su botón de cerrar y su contenido:
 * este componente solo resuelve dónde y cómo se muestra.
 */
export function DetailSheet({ onClose, children }: DetailSheetProps) {
  return (
    <>
      {/* Fondo oscurecido — solo mobile, donde el panel flota sobre la lista */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed inset-x-0 bottom-0 z-50 w-full max-h-[85vh] overflow-y-auto rounded-t-2xl shadow-2xl flex flex-col bg-white border border-[#c4c6cd] lg:static lg:z-auto lg:max-h-none lg:overflow-hidden lg:rounded-xl lg:w-80 lg:shrink-0 lg:self-start lg:sticky lg:top-0 lg:shadow-sm">
        {children}
      </aside>
    </>
  );
}
