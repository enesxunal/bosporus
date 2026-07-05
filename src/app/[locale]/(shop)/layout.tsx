import { B2cHeader } from "@/components/layout/B2cHeader";
import { B2cFooter } from "@/components/layout/B2cFooter";
import { DealTicker } from "@/components/b2c/DealTicker";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bosporus-gray-50">
      <DealTicker />
      <B2cHeader />
      <main className="flex-1 pb-mobile-nav">{children}</main>
      <B2cFooter />
      <MobileBottomNav />
    </div>
  );
}
