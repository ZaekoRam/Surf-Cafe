import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TiendaContent } from './tienda-content';

export const metadata: Metadata = {
  title: 'Tienda',
  description:
    'Hardware, periféricos, software y PCs armadas. Precios en pesos, entrega en Manzanillo o envío a toda la república.',
};

/**
 * Shell del servidor: solo trae el `metadata`. El contenido real (que lee
 * `?categoria=` con `useSearchParams`) vive en `tienda-content.tsx` — ver el
 * porqué ahí. El `<Suspense>` es requisito de Next para usar ese hook.
 */
export default function TiendaPage() {
  return (
    <Suspense fallback={null}>
      <TiendaContent />
    </Suspense>
  );
}
