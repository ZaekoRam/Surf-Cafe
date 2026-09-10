import { FrogMascot } from '@/components/brand/frog-mascot';
import { TrackingForm } from '@/components/tracking/tracking-form';

/** Banda del home que invita a rastrear un equipo ya entregado a taller. */
export function TrackerBand() {
  return (
    <section className="container py-28">
      <div className="hud-panel scanlines relative grid gap-10 p-8 md:grid-cols-[auto_1fr] md:items-center md:p-12">
        <FrogMascot state="inspecting" size={140} className="mx-auto" />

        <div>
          <p className="hud-label mb-3">Soporte</p>
          <h2 className="font-display text-3xl font-black uppercase md:text-4xl">
            ¿Ya dejaste tu equipo?
          </h2>
          <p className="mb-8 mt-3 max-w-lg text-foreground/70">
            Consulta en qué paso va sin llamar ni preguntar por WhatsApp. Actualizamos el estado en
            cuanto el técnico avanza.
          </p>

          <TrackingForm />
        </div>
      </div>
    </section>
  );
}
