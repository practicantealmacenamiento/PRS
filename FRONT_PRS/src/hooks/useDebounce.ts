import { useEffect, useState } from "react";

/**
 * Retarda la actualización de `value` por `delay` milisegundos.
 * Útil para evitar peticiones de red en cada pulsación de tecla.
 *
 * @param value  Valor a "debounce-ar"
 * @param delay  Tiempo de espera en ms (ej. 500)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
