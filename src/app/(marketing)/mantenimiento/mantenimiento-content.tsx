'use client';

import { useEffect, useState } from 'react';

import { QuoteWizard } from '@/components/maintenance/quote-wizard';
import { defaultServiceConfig } from '@/config/services';
import { createClient } from '@/lib/supabase/client';
import { fetchServiceConfig } from '@/lib/supabase/queries';
import { formatMXN } from '@/lib/utils';
import type { ServiceConfig } from '@/types/database';

export function MantenimientoContent() {
  // Arranca con el default para que no parpadee; si Supabase responde, lo cambia.
  const [config, setConfig] = useState<ServiceConfig>(defaultServiceConfig);

  useEffect(() => {
    let cancelled = false;
    fetchServiceConfig(createClient()).then((cfg) => {
      if (!cancelled && cfg) setConfig(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { settings, tiers } = config;

  return (
    <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <header className="mb-14 max-w-2xl">
        <p className="hud-label mb-3">02 — Servicio</p>
        <h1 className="font-display text-5xl font-black uppercase">
          {settings.quote_heading}
        </h1>
        <p className="mt-4 text-foreground/70">{settings.quote_subheading}</p>
      </header>

      <QuoteWizard config={config} />

      {/* Comparativa de paquetes */}
      <section className="mt-24" aria-labelledby="paquetes">
        <h2 id="paquetes" className="mb-10 font-display text-3xl font-black uppercase">
          Qué incluye cada paquete
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.slug} className="hud-panel flex flex-col p-6">
              <h3 className="font-display text-lg font-bold uppercase text-surf-green">
                {tier.label}
              </h3>
              {tier.duration && (
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                  {tier.duration}
                </p>
              )}
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
