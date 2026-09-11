import type { LucideIcon } from 'lucide-react';
import { CalendarDays, Cpu, Home, Radar, Wrench } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  /** Texto corto para el HUD del navbar. */
  code: string;
  description: string;
  icon: LucideIcon;
};

/** Arquitectura de 4 secciones. Todo el sitio cuelga de aqui. */
export const mainNav: NavItem[] = [
  {
    href: '/',
    label: 'Inicio',
    code: '00',
    description: 'La experiencia Surf Cafe',
    icon: Home,
  },
  {
    href: '/tienda',
    label: 'Tienda',
    code: '01',
    description: 'Hardware, periféricos y PCs armadas',
    icon: Cpu,
  },
  {
    href: '/mantenimiento',
    label: 'Mantenimiento',
    code: '02',
    description: 'Cotiza y agenda tu servicio',
    icon: Wrench,
  },
  {
    href: '/rastreo',
    label: 'Rastreo',
    code: '03',
    description: 'Sigue tu equipo en tiempo real',
    icon: Radar,
  },
  {
    href: '/citas',
    label: 'Citas',
    code: '04',
    description: 'Agenda tu diagnóstico o mantenimiento',
    icon: CalendarDays,
  },
];

export const adminNav = [
  { href: '/admin', label: 'Panel', code: 'HUD' },
  { href: '/admin/reparaciones', label: 'Reparaciones', code: 'REP' },
  { href: '/admin/productos', label: 'Productos', code: 'PRD' },
  { href: '/admin/inventario', label: 'Inventario', code: 'INV' },
  { href: '/admin/citas', label: 'Citas', code: 'CTA' },
] as const;
