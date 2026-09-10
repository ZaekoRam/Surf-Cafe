import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * Lockup de marca oficial: el vector real (`/public/logo-vector.svg`) que
 * mandó el cliente, completo — sin recortar.
 *
 * Antes se intentó recortar el cuadro (mostrar solo rana+triángulo, sin el
 * wordmark que trae dibujado adentro) para que el texto no se viera
 * chiquito. En la práctica el recorte terminaba cortando la mano de la
 * rana sin importar dónde se pusiera la línea — la mano y el letrero están
 * entrelazados en el dibujo original. Se volvió al cuadro completo, que es
 * como se veía bien desde el principio: el logo se ve íntegro, sin cortes,
 * aunque el texto interno quede chico a este tamaño (sigue siendo vector
 * nítido, solo pequeño — no roto).
 *
 * `<img>` plano en vez de `next/image`: el proyecto exporta estático
 * (`output: 'export'`) con `images.unoptimized: true`.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('group flex items-center gap-3', className)}
      aria-label="Surf Cafe PC Store — inicio"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-vector.svg"
        alt="Surf Cafe PC Store"
        className={cn(
          'shrink-0 drop-shadow-neon transition-transform group-hover:scale-110',
          compact ? 'h-11 w-11 sm:h-12 sm:w-12' : 'h-16 w-16'
        )}
      />

      <span className={cn('flex flex-col leading-none', compact && 'hidden sm:flex')}>
        <span className="font-display text-lg font-black uppercase tracking-[0.14em] text-surf-yellow text-glow-yellow">
          Surf Cafe
        </span>
        <span className="font-display text-[0.6rem] font-bold uppercase tracking-[0.42em] text-surf-green">
          PC Store
        </span>
      </span>
    </Link>
  );
}
