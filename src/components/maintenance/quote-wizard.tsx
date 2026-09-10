'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, MessageCircle } from 'lucide-react';
import { useMemo } from 'react';

import { FrogMascot, type MascotState } from '@/components/brand/frog-mascot';
import { devices, estimateQuote, issues, tiers } from '@/config/services';
import { cn, formatMXN, whatsappLink } from '@/lib/utils';
import { useQuote } from '@/store/quote';

const steps = ['Equipo', 'Falla', 'Paquete', 'Entrega', 'Resumen'] as const;

/** La rana reacciona al paso del wizard. */
const mascotByStep: MascotState[] = ['idle', 'inspecting', 'cleaning', 'tuning', 'proud'];

export function QuoteWizard() {
  const state = useQuote();

  // El estimado se calcula aquí (no como selector de Zustand): `estimateQuote`
  // regresa un objeto nuevo cada vez y eso haría un bucle infinito de renders
  // en Zustand v5. `useMemo` lo estabiliza mientras no cambien los campos.
  const estimate = useMemo(
    () =>
      state.device && state.tier
        ? estimateQuote({
            device: state.device,
            tier: state.tier,
            issues: state.issues,
            homePickup: state.homePickup,
          })
        : null,
    [state.device, state.tier, state.issues, state.homePickup]
  );

  // Cada paso decide si se puede avanzar.
  const canAdvance = [
    Boolean(state.device),
    state.issues.length > 0 || state.otherIssue.trim().length > 0,
    Boolean(state.tier),
    true,
    false,
  ][state.step];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ------------------- Panel del wizard ------------------- */}
      <div className="hud-panel p-8">
        {/* Indicador de pasos */}
        <ol className="mb-10 flex flex-wrap gap-x-2 gap-y-3">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center font-mono text-xs transition-colors',
                  i < state.step && 'bg-surf-green text-surface-deep',
                  i === state.step && 'border border-surf-green text-surf-green shadow-neon-sm',
                  i > state.step && 'border border-surface-grey text-muted-foreground'
                )}
              >
                {i < state.step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'font-display text-[0.65rem] font-bold uppercase tracking-widest',
                  i === state.step ? 'text-surf-green' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-surface-grey" />}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* ---- 0. Equipo ---- */}
            {state.step === 0 && (
              <fieldset>
                <legend className="mb-6 font-display text-xl font-bold uppercase">
                  ¿Qué equipo es?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {devices.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => state.setDevice(d.id)}
                      aria-pressed={state.device === d.id}
                      className={cn(
                        'clip-hud-sm border p-5 text-left transition-all',
                        state.device === d.id
                          ? 'border-surf-green bg-surf-green/10 shadow-neon'
                          : 'border-surface-grey hover:border-surf-green/50'
                      )}
                    >
                      <span className="block font-display text-sm font-bold uppercase tracking-wide">
                        {d.label}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{d.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* ---- 1. Falla ---- */}
            {state.step === 1 && (
              <fieldset>
                <legend className="mb-6 font-display text-xl font-bold uppercase">
                  ¿Qué le pasa? <span className="text-sm text-muted-foreground">(varias)</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {issues.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => state.toggleIssue(issue.id)}
                      aria-pressed={state.issues.includes(issue.id)}
                      className={cn(
                        'clip-hud-sm border p-4 text-left transition-all',
                        state.issues.includes(issue.id)
                          ? 'border-surf-yellow bg-surf-yellow/10'
                          : 'border-surface-grey hover:border-surf-yellow/50'
                      )}
                    >
                      <span className="block text-sm font-medium">{issue.label}</span>
                      {issue.note && (
                        <span className="mt-1 block text-xs text-surf-cyan">{issue.note}</span>
                      )}
                    </button>
                  ))}
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium">
                    Otro motivo <span className="text-muted-foreground">(escribe cuál)</span>
                  </span>
                  <input
                    value={state.otherIssue}
                    onChange={(e) => state.setOtherIssue(e.target.value)}
                    placeholder="Ej: la bisagra está floja, el touchpad no responde…"
                    className="clip-hud-sm w-full border border-surface-grey bg-surface-metal/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-surf-yellow"
                  />
                </label>
              </fieldset>
            )}

            {/* ---- 2. Paquete ---- */}
            {state.step === 2 && (
              <fieldset>
                <legend className="mb-6 font-display text-xl font-bold uppercase">
                  Elige el paquete
                </legend>
                <div className="space-y-3">
                  {tiers.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => state.setTier(tier.id)}
                      aria-pressed={state.tier === tier.id}
                      className={cn(
                        'clip-hud-sm flex w-full items-center justify-between gap-4 border p-5 text-left transition-all',
                        state.tier === tier.id
                          ? 'border-surf-green bg-surf-green/10 shadow-neon'
                          : 'border-surface-grey hover:border-surf-green/50'
                      )}
                    >
                      <span>
                        <span className="block font-display text-sm font-bold uppercase">
                          {tier.label}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {tier.includes.length} servicios · {tier.duration}
                        </span>
                      </span>
                      <span className="shrink-0 font-display text-lg font-bold text-surf-yellow">
                        {formatMXN(tier.base)}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* ---- 3. Entrega ---- */}
            {state.step === 3 && (
              <fieldset>
                <legend className="mb-6 font-display text-xl font-bold uppercase">
                  ¿Cómo nos lo haces llegar?
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: false, label: 'Lo llevo a la tienda', hint: 'Salagua, Manzanillo' },
                    { value: true, label: 'Pasen por él', hint: 'Costo adicional de recolección' },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => state.setHomePickup(option.value)}
                      aria-pressed={state.homePickup === option.value}
                      className={cn(
                        'clip-hud-sm border p-5 text-left transition-all',
                        state.homePickup === option.value
                          ? 'border-surf-green bg-surf-green/10 shadow-neon'
                          : 'border-surface-grey hover:border-surf-green/50'
                      )}
                    >
                      <span className="block font-display text-sm font-bold uppercase">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
                    </button>
                  ))}
                </div>

                {/* TODO(fase 2): react-day-picker + slots reales desde `appointments`. */}
                <p className="mt-6 border-l-2 border-surf-cyan/50 bg-surf-cyan/5 p-4 text-sm text-muted-foreground">
                  El calendario de citas se conecta en la fase 2. Por ahora cerramos la cita por
                  WhatsApp con el resumen que sigue.
                </p>
              </fieldset>
            )}

            {/* ---- 4. Resumen ---- */}
            {state.step === 4 && estimate && (
              <div>
                <h3 className="mb-6 font-display text-xl font-bold uppercase">Tu estimado</h3>

                <dl className="space-y-3">
                  {estimate.breakdown.map((line) => (
                    <div key={line.label} className="flex justify-between border-b border-surface-grey pb-3">
                      <dt className="text-sm text-foreground/75">{line.label}</dt>
                      <dd className="font-mono text-sm">{formatMXN(line.amount)}</dd>
                    </div>
                  ))}
                </dl>

                <a
                  href={whatsappLink(
                    `🐸 *SURF CAFE PC STORE*\n` +
                      `━━━━━━━━━━━━━━━━\n` +
                      `🔧 *Cotización de mantenimiento*\n\n` +
                      `▸ Equipo: *${devices.find((d) => d.id === state.device)?.label}*\n` +
                      `▸ Paquete: *${tiers.find((t) => t.id === state.tier)?.label}*\n` +
                      (state.issues.length
                        ? `▸ Fallas: ${state.issues
                            .map((id) => issues.find((i) => i.id === id)?.label)
                            .filter(Boolean)
                            .join(', ')}\n`
                        : '') +
                      (state.otherIssue.trim() ? `▸ Otro: ${state.otherIssue.trim()}\n` : '') +
                      `\n💰 *Estimado: ${formatMXN(estimate.min)} – ${formatMXN(estimate.max)}*\n` +
                      `_(el precio final se confirma tras el diagnóstico)_\n\n` +
                      `Quiero agendar, ¿qué horarios tienen?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon mt-8 w-full"
                >
                  <MessageCircle className="h-4 w-4" />
                  Agendar por WhatsApp
                </a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navegacion */}
        <div className="mt-10 flex justify-between gap-4 border-t border-surface-grey pt-6">
          <button
            type="button"
            onClick={state.back}
            disabled={state.step === 0}
            className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            Atras
          </button>

          {state.step < 4 && (
            <button
              type="button"
              onClick={state.next}
              disabled={!canAdvance}
              className="btn-neon disabled:pointer-events-none disabled:opacity-30"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------- HUD de estimado en vivo ------------------- */}
      <aside className="hud-panel sticky top-[calc(var(--nav-h)+1rem)] h-fit p-6">
        <FrogMascot state={mascotByStep[state.step]} size={96} className="mx-auto" />

        <p className="hud-label mt-4 text-center">Estimado en vivo</p>

        {estimate ? (
          <p className="mt-3 text-center font-display text-3xl font-black text-glow text-surf-green">
            {formatMXN(estimate.min)}
            <span className="block text-sm font-medium text-muted-foreground">
              a {formatMXN(estimate.max)}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Elige equipo y paquete para ver el precio.
          </p>
        )}

        <p className="mt-6 border-t border-surface-grey pt-4 text-xs leading-relaxed text-muted-foreground">
          Estimado informativo. El precio final se confirma tras el diagnóstico y puede variar si
          el equipo necesita refacciones.
        </p>
      </aside>
    </div>
  );
}
