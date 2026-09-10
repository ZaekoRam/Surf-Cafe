'use client';

import { useEffect, useState } from 'react';

import { AdminPage } from '@/components/admin/admin-shell';
import { createClient } from '@/lib/supabase/client';
import { fetchTodayAppointmentsStaff } from '@/lib/supabase/queries';
import type { Appointment } from '@/types/database';

/** TODO(fase 3): permitir confirmar / reagendar desde aquí, y un formulario público para agendar. */
export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTodayAppointmentsStaff(createClient()).then((data) => {
      if (!cancelled) setAppointments(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPage
      title="Citas"
      subtitle={new Date().toLocaleDateString('es-MX', { dateStyle: 'full' })}
    >
      {appointments === null ? (
        <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando citas…
        </p>
      ) : appointments.length === 0 ? (
        <p className="hud-panel p-12 text-center text-muted-foreground">
          No hay citas agendadas para hoy. Todavía no existe un formulario público para agendar
          (Fase 3 del roadmap) — por ahora las citas se cargan a mano en Supabase.
        </p>
      ) : (
        <ol className="space-y-3">
          {appointments.map((cita) => (
            <li key={cita.id} className="hud-panel flex flex-wrap items-center gap-6 p-5">
              <span className="font-display text-2xl font-black text-surf-green">
                {cita.time_slot}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{cita.customer_name}</span>
                <span className="block text-xs text-muted-foreground">{cita.service_type}</span>
              </span>
              <span className="code-chip">{cita.home_pickup ? 'Recolección' : 'En tienda'}</span>
            </li>
          ))}
        </ol>
      )}
    </AdminPage>
  );
}
