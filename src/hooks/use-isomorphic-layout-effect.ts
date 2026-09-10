import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect avisa en SSR. GSAP necesita medir antes de pintar,
 * asi que en el servidor caemos a useEffect (que ahi nunca corre).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
