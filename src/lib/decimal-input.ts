/**
 * Sanitiza el tipeo en inputs de números decimales pensados para mobile.
 *
 * Por qué existe: en iOS Safari, `type="number"` rechaza en silencio la COMA —
 * y el teclado decimal de un iPhone configurado en español muestra coma, no
 * punto. Resultado: el mecánico no puede cargar "5.5" de ninguna forma.
 *
 * El patrón correcto es `type="text"` + `inputMode="decimal"` (abre el teclado
 * numérico igual) + esta función en el onChange:
 *   - acepta coma o punto y normaliza a punto (formato del payload/parseFloat)
 *   - devuelve null si el texto no es un decimal parcial válido → el caller
 *     ignora ese cambio (no se puede tipear basura ni dos puntos)
 */
export function sanitizeDecimalInput(raw: string): string | null {
  const normalized = raw.replace(",", ".");
  return /^\d*\.?\d*$/.test(normalized) ? normalized : null;
}
