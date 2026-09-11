import type { Metadata } from 'next';

import { MantenimientoContent } from './mantenimiento-content';

export const metadata: Metadata = {
  title: 'Mantenimiento y cotizador',
  description:
    'Cotiza en línea la limpieza, el cambio de pasta térmica o el tuning de tu PC, laptop o consola. Agenda entrega en tienda o recolección a domicilio.',
};

/**
 * Shell del servidor: solo el `metadata`. El contenido (que lee los precios
 * en vivo de Supabase para que Surf Cafe pueda editarlos desde /admin sin
 * recompilar) vive en `mantenimiento-content.tsx`.
 */
export default function MantenimientoPage() {
  return <MantenimientoContent />;
}
