'use client';

import { AdaptiveDpr, PerformanceMonitor, Preload } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Envoltorio unico para todo lo 3D del sitio.
 *
 * Reglas:
 *  - Importarlo SIEMPRE con next/dynamic + { ssr: false } (three no corre en server).
 *  - `PerformanceMonitor` baja la resolucion en equipos lentos en vez de tirar FPS:
 *    la mitad de los clientes entran desde el celular.
 */
export function SceneCanvas({
  children,
  className,
  camera = { position: [0, 0, 6] as [number, number, number], fov: 42 },
}: {
  children: React.ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov: number };
}) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      className={cn('h-full w-full', className)}
      dpr={dpr}
      camera={camera}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // El canvas es decorativo: el contenido real vive en el DOM.
      aria-hidden
    >
      <PerformanceMonitor
        onIncline={() => setDpr(2)}
        onDecline={() => setDpr(1)}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />
      <Suspense fallback={null}>{children}</Suspense>
      <AdaptiveDpr pixelated />
      <Preload all />
    </Canvas>
  );
}
