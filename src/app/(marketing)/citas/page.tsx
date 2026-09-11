import type { Metadata } from 'next';

import { AppointmentForm } from '@/components/appointments/appointment-form';

export const metadata: Metadata = {
  title: 'Agenda tu cita',
  description:
    'Agenda una cita para diagnóstico, mantenimiento o reparación de tu equipo en Surf Cafe PC Store. En tienda o con recolección a domicilio.',
};

export default function CitasPage() {
  return (
    <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <header className="mb-12 max-w-2xl">
        <p className="hud-label mb-3">04 — Cita</p>
        <h1 className="font-display text-5xl font-black uppercase">
          Agenda tu <span className="text-glow text-surf-green">cita</span>
        </h1>
        <p className="mt-4 text-foreground/70">
          Elige día y hora, cuéntanos qué le pasa a tu equipo y confirmamos contigo por WhatsApp.
        </p>
      </header>

      <div className="mx-auto max-w-xl">
        <AppointmentForm />
      </div>
    </div>
  );
}
