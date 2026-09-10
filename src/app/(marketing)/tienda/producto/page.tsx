import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProductoContent } from './producto-content';

export const metadata: Metadata = {
  title: 'Producto',
  description: 'Ficha de producto — Surf Cafe PC Store, Manzanillo.',
};

/**
 * Shell del servidor: solo el `metadata`. La ficha real se arma en el
 * navegador leyendo `?slug=` con `useSearchParams` (ver `producto-content.tsx`).
 *
 * Antes esto era una ruta dinámica `/tienda/[slug]` que se pre-generaba en
 * build con `generateStaticParams`. Se cambió a `?slug=` porque con
 * `output: 'export'` una ruta dinámica solo puede servir los slugs que
 * existían al compilar — un producto nuevo dado de alta desde /admin
 * tronaba con 404 hasta el siguiente build. Así, cualquier producto que
 * esté en Supabase funciona al instante.
 */
export default function ProductoPage() {
  return (
    <Suspense fallback={null}>
      <ProductoContent />
    </Suspense>
  );
}
