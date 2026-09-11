'use client';

import { CalendarClock, Home, MessageCircle, Store, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AdminPage } from '@/components/admin/admin-shell';
import { createClient } from '@/lib/supabase/client';
import { deleteAppointmentStaff, fetchUpcomingAppointmentsStaff } from '@/lib/supabase/queries';
import { cn, customerWhatsappLink, errorText, todayISO } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types/database';

const statusMeta: Record<AppointmentStatus, { label: string; tone: string }> = {
  pendiente: { label: 'Pendiente', tone: 'border-surf-yellow/40 text-surf-yellow' },
  confirmada: { label: 'Confirmada', tone: 'border-surf-green/40 text-surf-green' },
  atendida: { label: 'Atendida', tone: 'border-surface-grey text-muted-foreground' },
  no_asistio: { label: 'No asistió', tone: 'border-destructive/40 text-destructive' },
  cancelada: { label: 'Cancelada', tone: 'border-destructive/40 text-destructive' },
};

function formatDateLabel(dateISO: string): string {
  const label = new Date(`${dateISO}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Agrupa las citas por fecha, ya vienen ordenadas cronológicamente desde la consulta. */
function groupByDate(appointments: Appointment[]): [string, Appointment[]][] {
  const groups = new Map<string, Appointment[]>();
  for (const cita of appointments) {
    const list = groups.get(cita.date) ?? [];
    list.push(cita);
    groups.set(cita.date, list);
  }
  return Array.from(groups.entries());
}

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const today = todayISO();

  useEffect(() => {
    let cancelled = false;
    fetchUpcomingAppointmentsStaff(createClient()).then((data) => {
      if (!cancelled) setAppointments(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = appointments ? groupByDate(appointments) : [];
  const proximas = (appointments ?? []).filter((a) => a.status !== 'cancelada').length;

  async function handleDelete(cita: Appointment) {
    if (
      !window.confirm(`¿Eliminar la cita de ${cita.customer_name} (${cita.date} ${cita.time_slot})?`)
    )
      return;
    const snapshot = appointments;
    setAppointments((prev) => (prev ?? []).filter((a) => a.id !== cita.id));
    try {
      await deleteAppointmentStaff(createClient(), cita.id);
      toast.success('Cita eliminada');
    } catch (e) {
      setAppointments(snapshot);
      toast.error('No se pudo eliminar', { description: errorText(e) });
    }
  }

  return (
    <AdminPage
      title="Citas"
      subtitle={appointments ? `${proximas} citas próximas` : 'Cargando…'}
    >
      {appointments === null ? (
        <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando citas…
        </p>
      ) : grouped.length === 0 ? (
        <p className="hud-panel p-12 text-center text-muted-foreground">
          No hay citas agendadas próximamente. Los clientes agendan desde{' '}
          <span className="text-surf-green">/citas</span> y confirman por WhatsApp.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, citas]) => {
            const isToday = date === today;
            return (
              <section key={date}>
                <header className="mb-3 flex items-center gap-3">
                  <h2
                    className={cn(
                      'font-display text-sm font-bold uppercase tracking-widest',
                      isToday ? 'text-surf-green' : 'text-foreground/80'
                    )}
                  >
                    {formatDateLabel(date)}
                  </h2>
                  {isToday && (
                    <span className="code-chip border-surf-green/50 text-surf-green shadow-neon-sm">
                      Hoy
                    </span>
                  )}
                </header>

                <ol className="space-y-3">
                  {citas.map((cita) => {
                    const meta = statusMeta[cita.status];
                    return (
                      <li
                        key={cita.id}
                        className={cn(
                          'hud-panel flex flex-wrap items-center gap-6 p-5',
                          isToday && 'border-surf-green/30'
                        )}
                      >
                        <span className="flex items-center gap-2 font-display text-2xl font-black text-surf-green">
                          <CalendarClock className="h-5 w-5 shrink-0 text-surf-green/60" />
                          {cita.time_slot}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{cita.customer_name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {cita.service_type} · {cita.device_type}
                          </span>
                          {cita.notes && (
                            <span className="mt-0.5 block text-xs text-muted-foreground/70">
                              {cita.notes}
                            </span>
                          )}
                        </span>

                        <a
                          href={customerWhatsappLink(
                            cita.customer_phone,
                            `Hola ${cita.customer_name}, te escribo de Surf Cafe por tu cita del ${formatDateLabel(cita.date)} a las ${cita.time_slot}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-surf-green"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {cita.customer_phone}
                        </a>

                        <span className="code-chip">
                          {cita.home_pickup ? (
                            <>
                              <Home className="h-3 w-3" /> Recolección
                            </>
                          ) : (
                            <>
                              <Store className="h-3 w-3" /> En tienda
                            </>
                          )}
                        </span>

                        <span className={cn('clip-hud-sm border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-widest', meta.tone)}>
                          {meta.label}
                        </span>

                        <button
                          type="button"
                          aria-label="Eliminar cita"
                          title="Eliminar cita"
                          onClick={() => handleDelete(cita)}
                          className="-m-1 p-1 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
