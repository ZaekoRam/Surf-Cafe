import { Clock, Facebook, Instagram, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/brand/logo';
import { LocationMap } from '@/components/layout/location-map';
import { mainNav } from '@/config/nav';
import { siteConfig } from '@/config/site';
import { whatsappLink } from '@/lib/utils';

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-surf-green/20 bg-surface-deep/80">
      <div className="hud-rule absolute inset-x-0 top-0" />

      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        {/* Marca */}
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.tagline}</p>
          <p className="text-xs text-muted-foreground/70">
            {siteConfig.trust.yearsInMarket}+ años en el mercado · {siteConfig.trust.brands}+ marcas
          </p>
        </div>

        {/* Navegacion */}
        <nav aria-label="Secciones">
          <h3 className="hud-label mb-4">Secciones</h3>
          <ul className="space-y-2.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-foreground/75 transition-colors hover:text-surf-green"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Ubicacion */}
        <div>
          <h3 className="hud-label mb-4">Sucursal</h3>
          <address className="space-y-3 text-sm not-italic text-foreground/75">
            <p className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-surf-green" />
              <span>{siteConfig.address.full}</span>
            </p>
            <p className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-surf-green" />
              <span>
                Lun a Vie 8:00 – 20:00
                <br />
                Sábado 8:00 – 14:00
              </span>
            </p>
          </address>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="hud-label mb-4">Contacto</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href={whatsappLink('Hola Surf Cafe, vengo de la pagina web.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-foreground/75 transition-colors hover:text-surf-green"
              >
                <MessageCircle className="h-4 w-4 text-surf-green" />
                {siteConfig.contact.whatsapp}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-foreground/75 transition-colors hover:text-surf-green"
              >
                <Instagram className="h-4 w-4 text-surf-green" />@{siteConfig.contact.instagram}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-foreground/75 transition-colors hover:text-surf-green"
              >
                <Facebook className="h-4 w-4 text-surf-green" />
                {siteConfig.contact.facebook}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Ubícanos */}
      <div className="border-t border-surface-grey/60 py-12">
        <div className="container">
          <h3 className="hud-label mb-5">Ubícanos</h3>
          <LocationMap />
        </div>
      </div>

      <div className="border-t border-surface-grey/60">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground/70 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. Manzanillo, Colima.
          </p>
          <p className="font-mono uppercase tracking-[0.2em] text-surf-green/70">
            {siteConfig.trust.yearsInMarket}+ años reparando equipos
          </p>
        </div>
      </div>
    </footer>
  );
}
