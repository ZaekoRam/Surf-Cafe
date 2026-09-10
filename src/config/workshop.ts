/**
 * "El Taller de Surf Cafe" — galería de video de la sección home.
 *
 * `videoUrl: null` es el estado real hoy: el negocio no nos ha pasado
 * clips de ensambles/mantenimiento todavía. La tarjeta se muestra igual
 * (con su tag y descripción) pero con un estado "Video próximamente" en
 * vez de inventar un embed de Instagram/TikTok que no existe — un link
 * roto o un post que no es de ellos es peor que no tener video.
 *
 * Cuando lleguen los clips reales: soltarlos en `public/videos/taller/` y
 * poner aquí la ruta (p.ej. `/videos/taller/ensamble-01.mp4`). También se
 * puede apuntar a un Reel/TikTok real cambiando `videoUrl` por su URL de
 * embed — el componente lo detecta solo.
 */
export type WorkshopTag = '#Ensambles' | '#Mantenimiento' | '#Storytime' | '#TipsTech';

export interface WorkshopVideo {
  id: string;
  title: string;
  description: string;
  tag: WorkshopTag;
  /** Ruta a un .mp4 local, o null si todavía no hay clip. */
  videoUrl: string | null;
}

export const workshopVideos: WorkshopVideo[] = [
  {
    id: 'ensamble-gamer',
    title: 'Armando una gamer desde cero',
    description: 'Del gabinete vacío al primer encendido, cable a cable.',
    tag: '#Ensambles',
    videoUrl: null,
  },
  {
    id: 'cambio-pasta',
    title: 'Cambio de pasta térmica',
    description: 'Por qué un CPU que se recalienta baja hasta 20°C con esto.',
    tag: '#Mantenimiento',
    videoUrl: null,
  },
  {
    id: 'historia-taller',
    title: 'Cómo empezó Surf Cafe',
    description: '10+ años después, así se ve el taller un martes cualquiera.',
    tag: '#Storytime',
    videoUrl: null,
  },
  {
    id: 'tip-ventiladores',
    title: 'Tip: limpia tus ventiladores así',
    description: 'El error más común que acorta la vida de tu PC.',
    tag: '#TipsTech',
    videoUrl: null,
  },
];

export const workshopTagStyles: Record<WorkshopTag, string> = {
  '#Ensambles': 'border-surf-green/40 bg-surf-green/10 text-surf-green',
  '#Mantenimiento': 'border-surf-cyan/40 bg-surf-cyan/10 text-surf-cyan',
  '#Storytime': 'border-surf-yellow/40 bg-surf-yellow/10 text-surf-yellow',
  '#TipsTech': 'border-surf-magenta/40 bg-surf-magenta/10 text-surf-magenta',
};
