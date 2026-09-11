import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { siteConfig } from '@/config/site';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea centavos o pesos a moneda mexicana. */
export function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** SC-7K2M9Q — codigo de rastreo legible por telefono. */
export function generateTrackingCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I, O, 0, 1
  let out = '';
  for (let i = 0; i < 7; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `SC-${out}`;
}

/**
 * Saca el id de un video de YouTube de casi cualquier formato de link:
 * watch?v=, youtu.be/, /shorts/, /embed/. Devuelve null si no lo encuentra.
 */
export function youtubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Link de WhatsApp con mensaje prellenado, hacia el número del negocio. */
export function whatsappLink(message: string) {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP ?? '5213141502203';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Link de WhatsApp hacia el número de un CLIENTE (para que el dueño le
 * escriba desde el panel admin) — distinto de `whatsappLink`, que siempre
 * apunta al negocio. Asume México (52) si el teléfono no trae lada de país.
 */
export function customerWhatsappLink(phone: string, message = '') {
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
  const withCountry = digits.length === 10 ? `52${digits}` : digits;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${withCountry}${text}`;
}

/**
 * Fecha de hoy en YYYY-MM-DD, en hora LOCAL del navegador.
 * `new Date().toISOString()` da la fecha en UTC — en Manzanillo (UTC-6),
 * después de las 18:00 ya "es mañana" en UTC, y comparar contra eso corre
 * "hoy" un día. Por eso este helper arma el string a mano con
 * getFullYear/getMonth/getDate en vez de toISOString().
 */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Link directo a /rastreo con el código ya puesto — para mandárselo al cliente. */
export function trackingLink(code: string): string {
  return `${siteConfig.url}/rastreo?code=${encodeURIComponent(code)}`;
}

/**
 * Mensaje de WhatsApp para mandarle el link de rastreo al cliente — mismo
 * estilo (negritas, separadores, emoji) que `buildOrderMessage` en
 * `cart-drawer.tsx` y el mensaje de citas, para que no llegue como texto
 * plano suelto entre los demás mensajes del negocio.
 */
export function trackingWhatsappMessage(customerName: string, trackingCode: string): string {
  return (
    `🐸 *SURF CAFE PC STORE*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `🔍 *Rastreo de tu equipo*\n\n` +
    `Hola ${customerName}, aquí puedes ver en qué va tu equipo cuando quieras:\n` +
    `${trackingLink(trackingCode)}\n\n` +
    `_Cualquier duda, contáctanos por aquí._`
  );
}

/**
 * Saca un texto legible de un error de Supabase (PostgrestError trae
 * `message`, y a veces `hint`/`details`) o de un Error normal. Para
 * mostrar en toasts sin tragarse la causa real.
 */
export function errorText(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as { message?: string; hint?: string; details?: string };
    return err.message || err.details || err.hint || 'Error desconocido';
  }
  return typeof e === 'string' ? e : 'Error desconocido';
}

/** "Teclado Mecánico ASUS" -> "teclado-mecanico-asus". */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita los acentos que NFD separó en marcas combinables
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
