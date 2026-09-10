'use client';

import { ChevronDown, Cpu, Wrench } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef } from 'react';

import { siteConfig } from '@/config/site';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';
import { gsap, motion as ease } from '@/lib/gsap';

/* three.js no existe en el servidor: carga solo en cliente. */
const SceneCanvas = dynamic(
  () => import('@/components/three/scene-canvas').then((m) => m.SceneCanvas),
  { ssr: false }
);
const Hero3DPC = dynamic(() => import('@/components/Hero3DPC').then((m) => m.Hero3DPC), {
  ssr: false,
});

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // --- Con movimiento permitido: intro completa + parallax de salida ---
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // `.anim-init` deja los elementos en opacity:0 para que no parpadeen
        // antes de que GSAP tome control. Hay que soltarlos ANTES de crear los
        // tweens: `gsap.from()` lee el valor actual como estado final, y si
        // sigue en 0 la animacion termina invisible.
        gsap.set('.anim-init', { opacity: 1 });

        const tl = gsap.timeline({ defaults: { ease: ease.ease } });

        tl.from('[data-hero="label"]', { y: 20, opacity: 0, duration: 0.5 })
          .from(
            '[data-hero="line"]',
            { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.09 },
            '-=0.2'
          )
          .from('[data-hero="copy"]', { y: 24, opacity: 0, duration: 0.6 }, '-=0.5')
          .from('[data-hero="cta"]', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.35')
          .from('[data-hero="stat"]', { opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.3')
          .from('[data-hero="cue"]', { opacity: 0, duration: 0.6 }, '-=0.2');

        // Parallax de salida: el texto se va antes que el 3D.
        gsap.to('[data-hero="content"]', {
          yPercent: -18,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      // --- Con movimiento reducido: se muestra todo, quieto ---
      // El CSS ya fuerza opacity en `.anim-init`, pero los transforms de GSAP
      // no los alcanza una media query: hay que no crearlos.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.anim-init', { opacity: 1, clearProps: 'transform' });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-[var(--nav-h)]"
    >
      {/* --- Capa 3D: torre gamer interactiva --- */}
      <div className="absolute inset-0 -z-10">
        <SceneCanvas>
          <Hero3DPC />
        </SceneCanvas>
      </div>

      {/* Degradado para que el texto siempre gane contraste sobre el 3D */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-surface via-surface/70 to-transparent"
      />

      <div data-hero="content" className="container relative py-12">
        <div className="max-w-3xl">
          <p data-hero="label" className="hud-label anim-init mb-6 flex items-center gap-3">
            <span className="inline-block h-2 w-2 animate-neon-pulse bg-surf-green" />
            Manzanillo, Colima · desde hace {siteConfig.trust.yearsInMarket} años
          </p>

          <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.25rem)] font-black uppercase leading-[0.95]">
            <span className="block overflow-hidden">
              <span data-hero="line" className="anim-init block">
                Tú creas
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-hero="line" className="anim-init block text-glow-yellow text-surf-yellow">
                tus sueños
              </span>
            </span>
            <span className="block overflow-hidden">
              <span
                data-hero="line"
                className="anim-init block whitespace-nowrap text-glow text-[clamp(1rem,2.3vw,1.85rem)] text-surf-green"
              >
                nosotros los ensamblamos
              </span>
            </span>
          </h1>

          <p data-hero="copy" className="anim-init mt-6 max-w-lg text-lg text-foreground/75">
            Venta, ensamble y mantenimiento de equipos de cómputo. Piso de venta, área de ensamble
            y servicio con garantía — no somos una tienda en línea sin cara.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link data-hero="cta" href="/tienda" className="btn-neon anim-init">
              <Cpu className="h-4 w-4" />
              Ver tienda
            </Link>
            <Link data-hero="cta" href="/mantenimiento" className="btn-neon-yellow anim-init">
              <Wrench className="h-4 w-4" />
              Cotizar mantenimiento
            </Link>
          </div>

          {/* Barra de datos HUD */}
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-surf-green/20 pt-6">
            {[
              { k: 'Marcas', v: `${siteConfig.trust.brands}+` },
              { k: 'Años', v: `${siteConfig.trust.yearsInMarket}+` },
              { k: 'Garantía', v: 'En todo' },
            ].map((stat) => (
              <div key={stat.k} data-hero="stat" className="anim-init">
                <dt className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                  {stat.k}
                </dt>
                <dd className="font-display text-2xl font-bold text-surf-green">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div
        data-hero="cue"
        className="anim-init absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground">
          Scroll
        </span>
        <ChevronDown className="h-5 w-5 animate-float text-surf-green" />
      </div>
    </section>
  );
}
