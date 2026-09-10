import { CartDrawer } from '@/components/store/cart-drawer';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { WhatsAppFab } from '@/components/layout/whatsapp-fab';

/** Shell publico: navbar HUD + contenido + footer + carrito + WhatsApp. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="min-h-screen">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  );
}
