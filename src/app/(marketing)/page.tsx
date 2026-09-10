import { FeaturedProducts } from '@/components/landing/featured-products';
import { Hero } from '@/components/landing/hero';
import { MaintenanceScroll } from '@/components/landing/maintenance-scroll';
import { TrackerBand } from '@/components/landing/tracker-band';
import { WorkshopGallery } from '@/components/WorkshopGallery';

/**
 * Home — recorrido de scrollytelling.
 *
 *   1. Hero con canvas 3D (torre gamer) + intro GSAP
 *   2. Proceso de mantenimiento pinneado (la rana guia)
 *   3. El taller — galería de video
 *   4. Productos destacados con tilt 3D
 *   5. Banda de rastreo
 *
 * Los productos destacados los trae `<FeaturedProducts />` en el navegador
 * (Supabase en vivo) — así, si el cliente marca un producto como destacado
 * desde /admin, aparece aquí sin recompilar ni resubir el sitio.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <MaintenanceScroll />
      <WorkshopGallery />
      <FeaturedProducts />
      <TrackerBand />
    </>
  );
}
