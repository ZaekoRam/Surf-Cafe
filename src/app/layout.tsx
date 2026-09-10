import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, JetBrains_Mono, Orbitron } from 'next/font/google';
import { Toaster } from 'sonner';

import { HudBackdrop } from '@/components/layout/hud-backdrop';
import { PageViewTracker } from '@/components/layout/page-view-tracker';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

import './globals.css';

/* --- Tipografia -----------------------------------------------------
   display : Orbitron      -> titulos, HUD, botones (angular, tecnica)
   sans    : Chakra Petch  -> cuerpo (legible, con caracter gamer)
   mono    : JetBrains     -> codigos de rastreo, SKUs, datos
------------------------------------------------------------------- */
const display = Orbitron({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Chakra_Petch({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Tienda de tecnología en Manzanillo`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'PC gamer Manzanillo',
    'reparación de computadoras Manzanillo',
    'mantenimiento de laptops Colima',
    'componentes de PC',
    'Surf Cafe PC Store',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: '/brand/logo-wordmark.png', width: 1600, height: 480 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/brand/logo-wordmark.png'],
  },
  icons: { icon: '/logo-vector.svg', shortcut: '/logo-vector.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0A0D12',
  colorScheme: 'dark',
};

/** Datos estructurados: negocio local real, ayuda a Google Maps y SEO. */
const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ComputerStore',
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  telephone: siteConfig.contact.whatsapp,
  address: {
    '@type': 'PostalAddress',
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.state,
    postalCode: siteConfig.address.zip,
    addressCountry: siteConfig.address.country,
  },
  openingHours: ['Mo-Fr 08:00-20:00', 'Sa 08:00-14:00'],
  sameAs: [siteConfig.contact.instagramUrl, siteConfig.contact.facebookUrl],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          display.variable,
          sans.variable,
          mono.variable,
          'min-h-screen bg-background font-sans text-foreground'
        )}
      >
        {/* Sin JS, GSAP nunca revela `.anim-init` y el hero quedaria en blanco. */}
        <noscript>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: '.anim-init{opacity:1!important}' }} />
        </noscript>

        <PageViewTracker />

        {/* Capa de ambiente: rejilla HUD + scanlines + vignette */}
        <HudBackdrop />

        <div className="relative z-10">{children}</div>

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            className: 'font-sans border border-surf-green/30 bg-surface-metal text-foreground',
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </body>
    </html>
  );
}
