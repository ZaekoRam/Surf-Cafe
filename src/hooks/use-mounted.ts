'use client';

import { useEffect, useState } from 'react';

/** Evita hidratacion desfasada en widgets que leen localStorage (carrito). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
