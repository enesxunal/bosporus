"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { trackSiteVisit } from "@/lib/site-funnel-client";
import { isSiteLocale } from "@/lib/site-funnel-shared";

export function SiteFunnelTracker() {
  const locale = useLocale();

  useEffect(() => {
    trackSiteVisit(isSiteLocale(locale) ? locale : null);
  }, [locale]);

  return null;
}
