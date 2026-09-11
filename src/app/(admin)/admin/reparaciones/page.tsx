'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminPage } from '@/components/admin/admin-shell';
import { CustomerDirectory } from '@/components/admin/customer-directory';
import { RepairIntakeDialog } from '@/components/admin/repair-intake-dialog';
import { RepairKanban } from '@/components/admin/repair-kanban';
import { createClient } from '@/lib/supabase/client';
import { fetchAllRepairsStaff, fetchArchivedRepairsStaff } from '@/lib/supabase/queries';
import type { Repair } from '@/types/database';

export default function ReparacionesPage() {
  const [repairs, setRepairs] = useState<Repair[] | null>(null);
  const [archived, setArchived] = useState<Repair[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    Promise.all([fetchAllRepairsStaff(supabase), fetchArchivedRepairsStaff(supabase)]).then(
      ([activas, archivadas]) => {
        if (cancelled) return;
        setRepairs(activas);
        setArchived(archivadas);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const activas = (repairs ?? []).filter(
    (r) => r.status !== 'entregado' && r.status !== 'cancelado'
  ).length;

  return (
    <AdminPage
      title="Reparaciones"
      subtitle={repairs ? `${activas} órdenes activas` : 'Cargando…'}
      actions={
        <RepairIntakeDialog
          onCreated={(repair) => setRepairs((prev) => [repair, ...(prev ?? [])])}
          trigger={
            <button type="button" className="btn-neon px-5 py-2.5 text-xs">
              <Plus className="h-4 w-4" />
              Registrar equipo
            </button>
          }
        />
      }
    >
      {repairs === null ? (
        <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando reparaciones…
        </p>
      ) : (
        <RepairKanban
          repairs={repairs}
          onRepairsChange={setRepairs}
          onArchived={(repair) => setArchived((prev) => [repair, ...prev])}
        />
      )}

      <CustomerDirectory
        repairs={archived}
        onCustomerRemoved={(ids) => setArchived((prev) => prev.filter((r) => !ids.includes(r.id)))}
        onRenewalMonthsChanged={(id, months) =>
          setArchived((prev) => prev.map((r) => (r.id === id ? { ...r, renewal_months: months } : r)))
        }
      />
    </AdminPage>
  );
}
