/**
 * Horarios disponibles para agendar cita en /citas.
 * Respeta los horarios reales del negocio (ver `siteConfig.hours` en
 * `site.ts`): Lunes a viernes 8:00-20:00, sábado 8:00-14:00, domingo cerrado.
 */
export const WEEKDAY_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];
export const SATURDAY_SLOTS = ['09:00', '11:00', '13:00'];

/** Motivos de cita — mismas categorías que el cotizador de mantenimiento. */
export const appointmentReasons = [
  'Diagnóstico',
  'Limpieza / mantenimiento',
  'Reparación',
  'Instalación de software',
  'Otro',
];

/** Horarios que aplican para una fecha (vacío = domingo, no se agenda). */
export function slotsForDate(dateISO: string): string[] {
  const day = new Date(`${dateISO}T12:00:00`).getDay(); // 0 = domingo, 6 = sábado
  if (day === 0) return [];
  if (day === 6) return SATURDAY_SLOTS;
  return WEEKDAY_SLOTS;
}
