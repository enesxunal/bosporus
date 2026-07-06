"use client";

import { AuthProvider } from "@/contexts/AuthContext";

export function ShopProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
