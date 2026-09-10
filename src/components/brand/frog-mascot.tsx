'use client';

import { motion } from 'framer-motion';
import { Droplet, Search, Sparkles, Wrench, Zap, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Mascota HUD de Surf Cafe.
 *
 * Usa el vector real del cliente (`/logo-vector.svg`) SIEMPRE, completo —
 * ya no hay ningún dibujo a mano ni recorte. Se probó recortar el cuadro
 * para esconder el wordmark que trae dibujado adentro, pero la mano de la
 * rana y el letrero están entrelazados en el arte original: no hay línea
 * de corte que no termine cortando algún dedo. Se volvió al cuadro
 * completo — se ve íntegro, aunque el texto interno quede chico a tamaños
 * de ícono (sigue siendo vector nítido, solo pequeño).
 *
 * El "estado" ya no es una pose distinta de la rana (eso requeriría
 * rehacer el arte a mano para cada una) sino una insignia — un ícono
 * pequeño con el color del paso, como una notificación sobre un avatar.
 * Funcionalmente es lo mismo que antes: cada paso del scrollytelling, el
 * cotizador y el rastreo siguen teniendo su propia señal visual.
 */
export type MascotState =
  | 'idle'
  | 'inspecting' // 01 diagnostico — lupa
  | 'cleaning' // 02 limpieza — burbujas
  | 'thermal' // 03 pasta termica — gota
  | 'tuning' // 04 overclock — llave (como en el video del logo)
  | 'proud'; // 05 RGB polish — chispa

const accentByState: Record<MascotState, string> = {
  idle: '#21E14B',
  inspecting: '#00F0FF',
  cleaning: '#00F0FF',
  thermal: '#FF00A8',
  tuning: '#E6FF00',
  proud: '#39FF14',
};

const iconByState: Partial<Record<MascotState, LucideIcon>> = {
  inspecting: Search,
  cleaning: Sparkles,
  thermal: Droplet,
  tuning: Wrench,
  proud: Zap,
};

export function FrogMascot({
  state = 'idle',
  className,
  size = 96,
}: {
  state?: MascotState;
  className?: string;
  size?: number;
}) {
  const accent = accentByState[state];
  const Icon = iconByState[state];

  return (
    <motion.span
      role="img"
      aria-label={`Mascota Surf Cafe${state !== 'idle' ? ` — ${state}` : ''}`}
      className={cn('relative inline-block', className)}
      style={{ width: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Halo del estado, detras */}
      <motion.span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full blur-xl"
        style={{ background: `radial-gradient(circle, ${accent}66, transparent 70%)` }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rana real, completa */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-vector.svg"
        alt=""
        aria-hidden="true"
        className="relative block aspect-square w-full drop-shadow-neon"
      />

      {/* Insignia del estado */}
      {Icon && (
        <motion.span
          aria-hidden
          className="absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-surface-deep"
          style={{
            width: Math.max(size * 0.36, 22),
            height: Math.max(size * 0.36, 22),
            backgroundColor: accent,
            boxShadow: `0 0 10px ${accent}aa`,
          }}
          animate={{ scale: [0.92, 1.06, 0.92] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className="h-[55%] w-[55%] text-surface-deep" strokeWidth={2.75} />
        </motion.span>
      )}
    </motion.span>
  );
}
