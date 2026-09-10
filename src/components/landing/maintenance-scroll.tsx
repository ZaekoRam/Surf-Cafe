'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';

import { FrogMascot, type MascotState } from '@/components/brand/frog-mascot';
import { maintenanceSteps } from '@/config/services';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { cn } from '@/lib/utils';

/**
 * Scrollytelling del proceso de mantenimiento.
 *
 * Como funciona:
 *   - La seccion mide `pasos * 100vh` de alto.
 *   - El escenario interno queda pinneado mientras dura el recorrido.
 *   - El progreso (0..1) se mapea a un indice de paso; la rana cambia de estado.
 *
 * El contenido de texto SIEMPRE esta en el DOM (bueno para SEO y lectores de
 * pantalla); lo unico que cambia es la presentacion.
 */
export function MaintenanceScroll() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const total = maintenanceSteps.length;

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: stage.current,
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          setProgress(self.progress);
          // El ultimo paso necesita su propio tramo: por eso `total` y no `total - 1`.
          setActive(Math.min(total - 1, Math.floor(self.progress * total)));
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const step = maintenanceSteps[active];

  return (
    <section
      ref={root}
      id="proceso"
      aria-label="Proceso de mantenimiento"
      style={{ height: `${maintenanceSteps.length * 100}vh` }}
      className="relative"
    >
      <div ref={stage} className="pin-stage sticky top-0 flex items-center overflow-hidden">
        <div className="container grid w-full items-center gap-12 lg:grid-cols-[1fr_auto_1fr]">
          {/* ---------- Columna de texto ---------- */}
          <div className="order-2 lg:order-1">
            <p className="hud-label mb-4">Proceso Surf Cafe</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <span className="font-mono text-6xl font-bold text-surf-green/25">{step.index}</span>
                <h2 className="mt-2 font-display text-4xl font-black uppercase leading-tight text-glow text-surf-green md:text-5xl">
                  {step.title}
                </h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/75">
                  {step.copy}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ---------- Mascota (centro) ---------- */}
          <div className="order-1 flex flex-col items-center gap-6 lg:order-2">
            <div className="hud-panel relative flex h-56 w-56 items-center justify-center md:h-72 md:w-72">
              {/* Anillo de progreso */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#2A2E35" strokeWidth="1.5" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#21E14B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
                  className="drop-shadow-neon"
                />
              </svg>

              <FrogMascot state={step.mascot as MascotState} size={150} />
            </div>

            <span className="code-chip">
              paso {step.index} / 0{maintenanceSteps.length}
            </span>
          </div>

          {/* ---------- Indice de pasos ---------- */}
          <ol className="order-3 hidden lg:block">
            {maintenanceSteps.map((s, i) => (
              <li key={s.id}>
                <div
                  className={cn(
                    'flex items-center gap-4 border-l-2 py-4 pl-5 transition-all duration-300',
                    i === active
                      ? 'border-surf-green bg-surf-green/5'
                      : 'border-surface-grey opacity-45'
                  )}
                >
                  <span className="font-mono text-xs text-surf-green">{s.index}</span>
                  <span className="font-display text-sm font-bold uppercase tracking-widest">
                    {s.title}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Barra de progreso inferior */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-surface-grey">
          <div
            className="h-full bg-gradient-to-r from-surf-green to-surf-yellow shadow-neon"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
