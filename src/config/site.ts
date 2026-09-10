/**
 * Datos reales del negocio (tomados de surfcafeoficial.com, sep-2026).
 * Fuente unica de verdad para SEO, footer, contacto y schema.org.
 */
export const siteConfig = {
  name: 'Surf Cafe PC Store',
  legalName: 'Surf Café Systems',
  tagline: 'Tú... crea tus sueños, nosotros los ensamblamos.',
  description:
    'Venta, ensamble y mantenimiento de equipos de cómputo en Manzanillo, Colima. PC gamer, workstations, componentes y periféricos con garantía.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://surfcafeoficial.com',
  locale: 'es-MX',
  currency: 'MXN',

  contact: {
    whatsapp: '+52 314 150 2203',
    whatsappRaw: '5213141502203',
    instagram: 'surfcafeoficial',
    instagramUrl: 'https://instagram.com/surfcafeoficial',
    facebook: 'SURF CAFE systems',
    facebookUrl: 'https://facebook.com/surfcafesystems',
  },

  address: {
    street: 'Blvd. Miguel de la Madrid Hurtado #100, Local 3',
    neighborhood: 'Colonia Salagua',
    zip: '28867',
    city: 'Manzanillo',
    state: 'Colima',
    country: 'MX',
    full: 'Blvd. Miguel de la Madrid Hurtado #100 Local 3, Col. Salagua, C.P. 28867, Manzanillo, Colima',
    // Coordenadas y CID reales, sacados del iframe de Google Maps que ya
    // tienen en surfcafeoficial.com — geocodificar la dirección de texto
    // (lo que se hacía antes) puede apuntar a un punto cercano pero
    // incorrecto, sobre todo con "Local 3" en la dirección. Esto es exacto.
    lat: 19.1097211991918,
    lng: -104.33732427080105,
    googlePlaceId: '0x8424d7a3c412c0b5:0x2a481d98929d1052',
  },

  hours: [
    { days: 'Lunes a Viernes', open: '08:00', close: '20:00' },
    { days: 'Sábado', open: '08:00', close: '14:00' },
    { days: 'Domingo', open: null, close: null },
  ],

  /** Diferenciadores que ya comunica el negocio. */
  trust: {
    yearsInMarket: 10,
    brands: 180,
    claims: ['Piso de venta', 'Área de ensamble', 'Mantenimiento en sitio'],
  },
} as const;

export type SiteConfig = typeof siteConfig;
