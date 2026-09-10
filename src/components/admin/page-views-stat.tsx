'use client';

import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

import { StatCard } from '@/components/admin/stat-card';
import { getPageViewCount, subscribePageViews } from '@/lib/analytics';

/**
 * Ve `src/lib/analytics.ts`: cuenta pageviews de ESTE navegador nada más,
 * no tráfico real del sitio. Por eso el hint lo dice explícito — mejor
 * que el dueño del negocio vea un número honesto a uno que parezca real
 * analítica y no lo sea.
 */
export function PageViewsStat() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(getPageViewCount());
    return subscribePageViews(setCount);
  }, []);

  return (
    <StatCard
      label="Visitas a la página"
      value={count ?? '—'}
      hint="Solo este navegador · analítica real pendiente"
      icon={Eye}
      tone="cyan"
    />
  );
}
