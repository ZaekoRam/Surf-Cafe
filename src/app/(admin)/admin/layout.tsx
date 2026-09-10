import type { Metadata } from 'next';

import { AdminGate } from '@/components/admin/admin-gate';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata: Metadata = {
  title: 'Panel Surf Cafe',
  robots: { index: false, follow: false },
};

/**
 * `AdminGate` valida contra Supabase Auth + RLS — sí hay servidor real
 * detrás (el de Supabase, no Hostinger). Ver `src/lib/admin-auth.ts` para
 * el detalle completo de qué es real y qué límites quedan.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}
