/**
 * Directorio de clientes atendidos (/admin/reparaciones, debajo del Kanban).
 *
 * Default de "cada cuántos meses ofrecerle mantenimiento" cuando el cliente
 * no tiene un intervalo propio elegido en su tarjeta (selector "Ofrecerle
 * mantenimiento cada..." — se guarda en `repairs.renewal_months` de su
 * última visita).
 */
export const RENEWAL_REMINDER_MONTHS = 6;

/**
 * Con cuántos meses de anticipación un cliente entra a "Ya les toca" antes
 * de que se cumpla su intervalo — para poder avisarle con tiempo, no hasta
 * el día que se vence. Ej: intervalo de 8 meses + margen de 1 mes = entra
 * a la lista al mes 7.
 */
export const RENEWAL_LEAD_TIME_MONTHS = 1;
