/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ---- Export estático para Hostinger (hosting compartido, sin Node) ----
  // `next build` genera la carpeta /out lista para subirse tal cual a
  // public_html. Esto apaga Route Handlers dinámicos, middleware e
  // Image Optimization en servidor — el proyecto ya no depende de ninguno.
  output: 'export',
  // Cada ruta exporta como carpeta/index.html (p.ej. /tienda/index.html)
  // en vez de /tienda.html. Hostinger sirve eso sin configurar rewrites.
  trailingSlash: true,

  images: {
    // Sin servidor no hay optimizador de imágenes: se sirven los archivos tal cual.
    unoptimized: true,
  },

  // three.js ships untranspiled ESM examples; keep them in the server bundle graph.
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
