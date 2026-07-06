import { ShopProviders } from "@/components/providers/ShopProviders";

export default function GewerbeLayout({ children }: { children: React.ReactNode }) {
  return <ShopProviders>{children}</ShopProviders>;
}
