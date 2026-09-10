import type { Metadata } from 'next';

import { QuoteWizard } from '@/components/maintenance/quote-wizard';
import { tiers } from '@/config/services';
import { formatMXN } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Mantenimiento y cotizador',
  description:
    'Cotiza en línea la limpieza, el cambio de pasta térmica o el tuning de tu PC, laptop o consola. Agenda entrega en tienda o recolección a domicilio.',
};

export default function MantenimientoPage() {
  return (
    <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <header className="mb-14 max-w-2xl">
        <p className="hud-label mb-3">02 — Servicio</p>
        <h1 className="font-display text-5xl font-black uppercase">
          Cotiza tu <span className="text-glow text-surf-green">mantenimiento</span>
        </h1>
        <p className="mt-4 text-foreground/70">
          Cuatro preguntas y te damos un estimado al instante. El precio final se confirma después
          del diagnóstico físico — nunca cobramos sorpresas.
        </p>
      </header>

      <QuoteWizard />

      {/* Comparativa de paquetes */}
      <section className="mt-24" aria-labelledby="paquetes">
        <h2 id="paquetes" className="mb-10 font-display text-3xl font-black uppercase">
          Qué incluye cada paquete
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.id} className="hud-panel flex flex-col p-6">
              <h3 className="font-display text-lg font-bold uppercase text-surf-green">
                {tier.label}
              </h3>
              <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                {tier.duration}
              </p>
              <p className="mt-4 font-display text-3xl font-black text-glow-yellow text-surf-yellow">
                desde {formatMXN(tier.base)}
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-foreground/75">
                {tier.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 bg-surf-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
