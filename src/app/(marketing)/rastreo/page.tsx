import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RastreoContent } from './rastreo-content';

export const metadata: Metadata = {
  title: 'Rastreo de reparación',
  description: 'Consulta el estado de tu equipo con tu código de rastreo Surf Cafe.',
};

/**
 * Shell del servidor: solo trae el `metadata`. El contenido real (que lee
 * `?code=` con `useSearchParams`) vive en `rastreo-content.tsx`.
 */
export default function RastreoPage() {
  return (
    <Suspense fallback={null}>
      <RastreoContent />
    </Suspense>
  );
}
