/**
 * Motor de precios del cotizador. Precios base en MXN.
 * TODO(Carlo): validar cada precio con el negocio antes de publicar.
 */

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

/**
 * Precio estimado del servicio. Es un ESTIMADO: el precio final
 * se confirma tras el diagnostico fisico.
 */
export function estimateQuote(input: {
  device: DeviceType;
  tier: ServiceTier;
  issues: IssueId[];
  homePickup: boolean;
}) {
  const device = devices.find((d) => d.id === input.device);
  const tier = tiers.find((t) => t.id === input.tier);
  if (!device || !tier) return { min: 0, max: 0, breakdown: [] as const };

  const labor = Math.round(tier.base * device.factor);
  const surcharges = input.issues.reduce(
    (sum, id) => sum + (issues.find((i) => i.id === id)?.surcharge ?? 0),
    0
  );
  const pickup = input.homePickup ? pickupFee : 0;
  const subtotal = labor + surcharges + pickup;

  return {
    /** Rango porque el diagnostico puede revelar refacciones. */
    min: subtotal,
    max: Math.round(subtotal * 1.25),
    breakdown: [
      { label: `${tier.label} — ${device.label}`, amount: labor },
      ...(surcharges ? [{ label: 'Fallas reportadas', amount: surcharges }] : []),
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
