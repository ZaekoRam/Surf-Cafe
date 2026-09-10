/**
 * Capa de ambiente global: rejilla HUD, scanlines y vignette. Va fija
 * detras de todo (z-0) y no intercepta clics.
 *
 * Hubo una franja de "código decorativo" (corchetes anidados, estilo
 * supabase.com — ver `code-field.tsx`, ya no se usa): quedó estática al
 * navegar entre pestañas (la opacidad se asigna una sola vez al montar, no
 * se repetía) y estorbaba la lectura de los banners de abajo. Se quitó por
 * pedido directo — si se vuelve a pedir el efecto, revisar primero por qué
 * el patrón se sentía "vivo" en el sitio original antes de reactivarlo.
 */
export function HudBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Rejilla tecnica */}
      <div className="absolute inset-0 bg-grid-hud bg-grid-hud opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />

      {/* Halo verde superior */}
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-radial-glow" />

      {/* Scanlines CRT */}
      <div className="absolute inset-0 bg-scanline opacity-30 mix-blend-overlay" />

      {/* Barrido lento de luz */}
      <div className="absolute inset-x-0 top-0 h-24 animate-scan-down bg-gradient-to-b from-surf-green/[0.07] to-transparent" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#050508_100%)]" />
    </div>
  );
}
