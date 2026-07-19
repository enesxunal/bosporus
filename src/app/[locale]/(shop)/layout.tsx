import { B2cHeader } from "@/components/layout/B2cHeader";
import { B2cFooter } from "@/components/layout/B2cFooter";
import { DealTicker } from "@/components/b2c/DealTicker";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { ShopProviders } from "@/components/providers/ShopProviders";
import { getShopNavData } from "@/lib/products-db";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const { categories, hasPromos } = await getShopNavData();

  return (
    <ShopProviders>
      <div className="min-h-screen flex flex-col bg-bosporus-gray-50">
        <DealTicker hasPromos={hasPromos} />
        <B2cHeader categories={categories} hasPromos={hasPromos} />
        <main className="flex-1 pb-mobile-nav">{children}</main>
        <B2cFooter />
        <MobileBottomNav />
        <WhatsAppFloat />
      </div>
    </ShopProviders>
  );
}
