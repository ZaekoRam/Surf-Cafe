'use client';

/**
 * Contador de visitas MUY honesto sobre sus límites.
 *
 * El sitio exporta estático (Hostinger, sin servidor), así que no hay dónde
 * agregar visitas de verdad entre visitantes distintos. Esto cuenta paginazos
 * dentro de ESTE navegador únicamente — sirve para probar que el panel
 * admin "vive" y reacciona, no como analítica real del negocio.
 *
 * TODO(fase 2/3): sustituir por Plausible, GA4, o una tabla `page_views` en
 * Supabase con un insert desde el cliente — cualquiera de esas sí agrega
 * visitas de todos los visitantes.
 */
const STORAGE_KEY = 'surfcafe_pageviews_v1';
const CHANGE_EVENT = 'surfcafe:pageviews-changed';

function readCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY) ?? 0) || 0;
  } catch {
    // Modo privado / storage bloqueado: no truena, solo no cuenta.
    return 0;
  }
}

/** Suma un pageview y avisa a quien esté escuchando (p.ej. el admin abierto en otra pestaña de este navegador). */
export function registerPageView(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const next = readCount() + 1;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
    return next;
  } catch {
    return readCount();
  }
}

export function getPageViewCount(): number {
  return readCount();
}

export function subscribePageViews(onChange: (count: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e: Event) => onChange((e as CustomEvent<number>).detail);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange(readCount());
  };

  window.addEventListener(CHANGE_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
