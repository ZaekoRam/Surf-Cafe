import { ExternalLink, MapPin } from 'lucide-react';

import { siteConfig } from '@/config/site';

/**
 * Mapa de la sucursal, con el marco HUD de la marca encima.
 *
 * El `src` del iframe es el mismo que ya usan en surfcafeoficial.com
 * (Place ID real de "SURFCAFE systems" en Google Maps) — NO se genera
 * geocodificando la dirección de texto. La primera versión de este
 * componente sí lo hacía (`maps.google.com/maps?q=<dirección>`) y el pin
 * caía en el lugar equivocado: el geocodificador de Google no siempre
 * resuelve bien direcciones con "Local 3" al final. Usar el Place ID
 * verificado evita ese problema de raíz.
 *
 * El look "gamer" sale del marco (esquinas cortadas, borde neón,
 * scanlines, degradado) y un filtro CSS que oscurece el mapa — el embed
 * sin API key no permite un estilo de mapa oscuro de verdad (eso requiere
 * la API de JS + Map ID, con facturación).
 */
export function LocationMap() {
  const embedSrc =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d942.4882300718185!2d-104.33732427080105!3d19.1097211991918!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8424d7a3c412c0b5%3A0x2a481d98929d1052!2sSURFCAFE%20systems!5e0!3m2!1ses!2smx!4v1613095173108!5m2!1ses!2smx';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${siteConfig.address.lat},${siteConfig.address.lng}&destination_place_id=${siteConfig.address.googlePlaceId}`;

  return (
    <div className="hud-panel scanlines group relative overflow-hidden">
      {/* Esquinas HUD */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-surf-green"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-surf-green"
      />

      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <iframe
          title="Ubicación de Surf Cafe PC Store en Manzanillo"
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full [filter:invert(92%)_hue-rotate(180deg)_grayscale(0.15)_brightness(0.95)_contrast(1.05)]"
        />

        {/* Deja pasar el clic al mapa pero mantiene el degradado de marca en los bordes */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-deep/70 via-transparent to-surface-deep/30"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-surf-green/20 bg-surface-metal/80 p-4">
        <p className="flex items-start gap-2 text-xs text-foreground/75">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-surf-green" />
          {siteConfig.address.full}
        </p>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="clip-hud-sm inline-flex shrink-0 items-center gap-2 border border-surf-green/50 bg-surf-green/10 px-4 py-2 font-display text-[0.65rem] font-bold uppercase tracking-widest text-surf-green transition-all hover:bg-surf-green hover:text-surface-deep hover:shadow-neon"
        >
          Cómo llegar
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
