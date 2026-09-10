'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

import { whatsappLink } from '@/lib/utils';

/** Boton flotante de WhatsApp: el canal real de venta del negocio. */
export function WhatsAppFab() {
  return (
    <motion.a
      href={whatsappLink('¡Hola Surf Cafe! Quiero información sobre:')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-surf-green/60 bg-surface-metal text-surf-green shadow-neon-lg"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-surf-green/20" />
      <MessageCircle className="relative h-6 w-6" />
    </motion.a>
  );
}
