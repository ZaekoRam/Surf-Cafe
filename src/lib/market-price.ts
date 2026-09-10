/**
 * Ayudante de referencia de precio de mercado (DDTech / Cyberpuerta).
 *
 * Por qué esto NO hace fetch en vivo a esos sitios:
 *  1. El sitio exporta estático — no hay servidor propio que pueda actuar
 *     de proxy, y pedirle a esos dominios desde el navegador del admin
 *     choca con CORS (ninguno de los dos expone una API pública).
 *  2. Aunque hubiera servidor, ninguno publica una API de precios: habría
 *     que scrapear su HTML, algo frágil y que se puede romper con cualquier
 *     rediseño de su sitio.
 *
 * Lo que sí hace: abre una búsqueda real en cada tienda para que el admin
 * compare con sus propios ojos, y le da un campo para anotar lo que vio —
 * así el "ayudante" es honesto sobre ser manual, no un scraper disfrazado.
 *
 * TODO(fase 3): si de verdad se necesita precio en vivo, la forma correcta
 * es una función server-side (p.ej. Supabase Edge Function) que sí pueda
 * hacer el fetch/scrape sin problema de CORS — eso ya no es compatible con
 * hosting 100% estático como Hostinger.
 */
export function buildMarketSearchUrl(retailer: 'ddtech' | 'cyberpuerta', query: string): string {
  const q = query.trim();
  // Búsqueda de Google restringida al sitio del retailer: funciona siempre,
  // a diferencia de adivinar el patrón interno de búsqueda de cada tienda
  // (no se pudo verificar en vivo el de DDTech durante el desarrollo).
  const site = retailer === 'ddtech' ? 'ddtech.com.mx' : 'cyberpuerta.mx';
  return `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${q}`)}`;
}

export function priceDelta(ownPrice: number, marketPrice: number | null) {
  if (marketPrice === null || marketPrice <= 0) return null;
  const diff = ownPrice - marketPrice;
  const pct = (diff / marketPrice) * 100;
  return { diff, pct };
}
