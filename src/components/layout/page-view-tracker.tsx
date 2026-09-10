'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { registerPageView } from '@/lib/analytics';

/**
 * Sin salida visual. Se monta una vez en el layout raíz y suma un pageview
 * cada vez que cambia la ruta (incluida la primera carga). Ver
 * `src/lib/analytics.ts` para las limitaciones reales de este contador.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    registerPageView();
  }, [pathname]);

  return null;
}
