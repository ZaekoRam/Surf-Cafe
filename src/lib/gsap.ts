'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Registro unico de plugins. Importar SIEMPRE gsap desde aqui
 * (nunca desde 'gsap' directo): asi el registro ocurre en un solo modulo.
 * `registerPlugin` es idempotente, repetirlo con Fast Refresh no rompe nada.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/** Duraciones y curvas compartidas: la marca se mueve igual en todos lados. */
export const motion = {
  ease: 'power3.out',
  easeIn: 'power2.in',
  fast: 0.35,
  base: 0.6,
  slow: 1.1,
} as const;

export { gsap, ScrollTrigger };
