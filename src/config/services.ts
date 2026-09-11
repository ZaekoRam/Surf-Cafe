/**
 * Motor de precios del cotizador. Precios base en MXN.
 *
 * Estos valores son solo el DEFAULT / fallback. Los reales los edita Surf
 * Cafe desde /admin/mantenimiento y viven en Supabase (tablas
 * `service_devices`, `service_tiers`, `service_issues`, `service_settings`).
 * `computeEstimate()` recibe la config (de Supabase o este default) y ya
 * calcula desde el primer paso, sin esperar a que elijan paquete.
 */

import type { ServiceConfig } from '@/types/database';

export type DeviceType = 'desktop' | 'laptop' | 'console' | 'allinone';
export type ServiceTier = 'basico' | 'profundo' | 'premium';

export const devices: {
  id: DeviceType;
  label: string;
  hint: string;
  /** Multiplicador de mano de obra: desarmar una laptop cuesta mas. */
  factor: number;
}[] = [
  { id: 'desktop', label: 'PC de escritorio', hint: 'Gabinete, torre gamer', factor: 1 },
  { id: 'laptop', label: 'Laptop', hint: 'Portátil de cualquier marca', factor: 1.35 },
  { id: 'console', label: 'Consola', hint: 'PS4/PS5, Xbox, Switch', factor: 1.25 },
  { id: 'allinone', label: 'All-in-One', hint: 'iMac, AIO Dell/HP', factor: 1.5 },
];

export const tiers: {
  id: ServiceTier;
  label: string;
  base: number;
  duration: string;
  includes: string[];
  accent: 'green' | 'yellow' | 'cyan';
}[] = [
  {
    id: 'basico',
    label: 'Limpieza Básica',
    base: 350,
    duration: '2 - 4 hrs',
    includes: [
      'Limpieza externa y de ventilación',
      'Aire comprimido en disipadores',
      'Diagnóstico general de software',
      'Reporte de temperaturas',
    ],
    accent: 'cyan',
  },
  {
    id: 'profundo',
    label: 'Mantenimiento Profundo',
    base: 750,
    duration: '1 - 2 días',
    includes: [
      'Todo lo del básico',
      'Desarmado completo del equipo',
      'Cambio de pasta térmica premium',
      'Cambio de thermal pads',
      'Optimización de Windows y drivers',
    ],
    accent: 'green',
  },
  {
    id: 'premium',
    label: 'Overclock & RGB Polish',
    base: 1450,
    duration: '2 - 4 días',
    includes: [
      'Todo lo del profundo',
      'Metal líquido en CPU (si aplica)',
      'Curva de ventiladores a medida',
      'Overclock estable + stress test',
      'Cable management y sincronía RGB',
    ],
    accent: 'yellow',
  },
];

export type IssueId =
  | 'temperatura'
  | 'lentitud'
  | 'no-enciende'
  | 'pantalla'
  | 'liquidos'
  | 'virus'
  | 'upgrade'
  | 'ruido';

export const issues: { id: IssueId; label: string; surcharge: number; note?: string }[] = [
  { id: 'temperatura', label: 'Se calienta / se apaga solo', surcharge: 0 },
  { id: 'lentitud', label: 'Va lento', surcharge: 150 },
  { id: 'ruido', label: 'Hace ruido raro', surcharge: 200 },
  { id: 'virus', label: 'Virus o publicidad', surcharge: 250 },
  { id: 'no-enciende', label: 'No enciende', surcharge: 400, note: 'Requiere diagnóstico en sitio' },
  { id: 'pantalla', label: 'Pantalla dañada', surcharge: 0, note: 'Cotización sujeta a refacción' },
  { id: 'liquidos', label: 'Cayó líquido', surcharge: 600, note: 'Urgente: no lo enciendas' },
  { id: 'upgrade', label: 'Quiero mejorarlo', surcharge: 0, note: 'Se cotiza con las piezas' },
];

export const pickupFee = 250;

/** Fallback usado si Supabase no devuelve config (tablas vacías o sin red). */
export const defaultServiceConfig: ServiceConfig = {
  devices: devices.map((d, i) => ({
    slug: d.id,
    label: d.label,
    hint: d.hint,
    factor: d.factor,
    sort_order: i,
    active: true,
  })),
  tiers: tiers.map((t, i) => ({
    slug: t.id,
    label: t.label,
    base: t.base,
    duration: t.duration,
    includes: [...t.includes],
    accent: t.accent,
    sort_order: i,
    active: true,
  })),
  issues: issues.map((s, i) => ({
    slug: s.id,
    label: s.label,
    surcharge: s.surcharge,
    note: s.note ?? null,
    sort_order: i,
    active: true,
  })),
  settings: {
    pickup_fee: pickupFee,
    quote_heading: 'Cotiza tu mantenimiento',
    quote_subheading:
      'Cuatro preguntas y te damos un estimado al instante. El precio final se confirma después del diagnóstico físico — nunca cobramos sorpresas.',
  },
};

export interface EstimateLine {
  label: string;
  amount: number;
}
export interface EstimateResult {
  /** true mientras no se elige paquete: el total sale con el más barato como ancla. */
  provisional: boolean;
  min: number;
  max: number;
  breakdown: EstimateLine[];
}

/**
 * Estimado del servicio, calculado desde el PRIMER paso.
 *   - Sin equipo elegido: null (no hay nada que mostrar).
 *   - Con equipo pero sin paquete: usa el paquete más barato como "desde".
 *   - Con paquete elegido: total real.
 * Es un ESTIMADO: el precio final se confirma tras el diagnóstico físico.
 */
export function computeEstimate(
  config: ServiceConfig,
  input: {
    device: string | null;
    tier: string | null;
    issues: string[];
    homePickup: boolean;
  }
): EstimateResult | null {
  const device = config.devices.find((d) => d.slug === input.device);
  if (!device) return null;

  const chosen = input.tier ? config.tiers.find((t) => t.slug === input.tier) : undefined;
  const tier =
    chosen ?? [...config.tiers].sort((a, b) => a.base - b.base)[0];
  if (!tier) return null;
  const provisional = !chosen;

  const labor = Math.round(tier.base * device.factor);

  const issueLines: EstimateLine[] = input.issues
    .map((slug) => config.issues.find((i) => i.slug === slug))
    .filter((i): i is NonNullable<typeof i> => Boolean(i) && (i as { surcharge: number }).surcharge > 0)
    .map((i) => ({ label: i.label, amount: i.surcharge }));

  const surcharges = issueLines.reduce((sum, l) => sum + l.amount, 0);
  const pickup = input.homePickup ? config.settings.pickup_fee : 0;
  const subtotal = labor + surcharges + pickup;

  return {
    provisional,
    min: subtotal,
    max: Math.round(subtotal * 1.25),
    breakdown: [
      { label: `${tier.label} — ${device.label}`, amount: labor },
      ...issueLines,
      ...(pickup ? [{ label: 'Recolección a domicilio', amount: pickup }] : []),
    ],
  };
}

/** Pasos del scrollytelling del home. La rana los acompaña. */
export const maintenanceSteps = [
  {
    id: 'diagnostico',
    index: '01',
    title: 'Diagnóstico',
    copy: 'Conectamos el equipo al banco de pruebas. Temperaturas, voltajes, SMART del disco y logs de Windows. Nada se toca hasta saber qué falla.',
    mascot: 'inspecting',
  },
  {
    id: 'limpieza',
    index: '02',
    title: 'Limpieza Profunda',
    copy: 'Desarmado total. Ultrasonido en disipadores, aire a presión controlada y limpieza de contactos. El polvo de Manzanillo es salino: se lleva las tarjetas.',
    mascot: 'cleaning',
  },
  {
    id: 'termica',
    index: '03',
    title: 'Pasta Térmica / Metal Líquido',
    copy: 'Aplicación precisa según el die del procesador. Thermal pads a la medida en VRM y VRAM. Bajamos entre 15 y 25 grados en carga.',
    mascot: 'thermal',
  },
  {
    id: 'overclock',
    index: '04',
    title: 'Overclock & Tuning',
    copy: 'Curvas de ventilador silenciosas, perfiles XMP/EXPO y overclock estable validado con stress test. Rendimiento sin sacrificar la vida del equipo.',
    mascot: 'tuning',
  },
  {
    id: 'rgb',
    index: '05',
    title: 'RGB Polish',
    copy: 'Cable management, sincronía de iluminación y limpieza de cristal. Tu equipo regresa más rápido, más frío y más bonito de como llegó.',
    mascot: 'proud',
  },
] as const;

export type MaintenanceStep = (typeof maintenanceSteps)[number];
