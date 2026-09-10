import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

/** Link de WhatsApp con mensaje prellenado. */
export function whatsappLink(message: string) {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP ?? '5213141502203';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
