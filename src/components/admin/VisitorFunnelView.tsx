"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowDown,
  BadgeEuro,
  Clock3,
  CreditCard,
  Eye,
  Globe,
  Lightbulb,
  Loader2,
  LogIn,
  MonitorSmartphone,
  RefreshCw,
  ShoppingCart,
  UserPlus,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FunnelTrendChart } from "@/components/admin/FunnelTrendChart";
import { KpiSparkline, PeriodDeltaBadge } from "@/components/admin/FunnelKpiDelta";
import {
  dropOff,
  getSiteFunnelInsights,
  periodDelta,
  stageShare,
  type FunnelDays,
  type SiteFunnelInsight,
  type SiteFunnelResponse,
  type SiteFunnelSummary,
} from "@/lib/site-funnel-dashboard";
import type { AcquisitionSource } from "@/lib/acquisition";
import type { DeviceBucket } from "@/lib/site-funnel-dashboard";

type LoadError = "auth" | "generic" | null;

const INSIGHT_KEYS: Record<SiteFunnelInsight, string> = {
  viewToCartLow: "insightViewToCartLow",
  cartToRegisterDrop: "insightCartToRegisterDrop",
  checkoutWithoutPurchase: "insightCheckoutWithoutPurchase",
  minOrderFriction: "insightMinOrderFriction",
  waitingForData: "insightWaitingForData",
};

export function VisitorFunnelView({
  days,
  locale,
  reloadSignal = 0,
}: {
  days: FunnelDays;
  locale: string;
  reloadSignal?: number;
}) {
  const t = useTranslations("siteFunnel");
  const tAdmin = useTranslations("adminFunnel");
  const [summary, setSummary] = useState<SiteFunnelSummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/admin/site-funnel?days=${days}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          setError("auth");
          return;
        }
        if (!response.ok) {
          setError("generic");
          return;
        }
        const data = (await response.json()) as SiteFunnelResponse;
        const selected = data.windows[String(days) as `${FunnelDays}`];
        if (!selected?.ok) {
          setError("generic");
          return;
        }
        setError(null);
        setSummary(selected);
        setGeneratedAt(data.generatedAt);
      })
      .catch((loadError: Error) => {
        if (loadError.name !== "AbortError") setError("generic");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [days, reloadKey, reloadSignal]);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "de-DE"),
    [locale]
  );
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "de-DE", {
        maximumFractionDigits: 1,
      }),
    [locale]
  );
  const formatPercentage = (value: number | null) =>
    value === null ? "—" : `%${percentFormatter.format(value)}`;

  const stages = useMemo(() => {
    if (!summary) return [];
    return [
      { key: "visit", label: t("visit"), value: summary.visit, icon: Users, level: "visitor" },
      {
        key: "productView",
        label: t("productView"),
        value: summary.productView,
        icon: Eye,
        level: "visitor",
      },
      {
        key: "addToCart",
        label: t("addToCart"),
        value: summary.addToCart,
        icon: ShoppingCart,
        level: "visitor",
      },
      {
        key: "cartView",
        label: t("cartView"),
        value: summary.cartView,
        icon: ShoppingCart,
        level: "visitor",
      },
      {
        key: "registerLogin",
        label: t("registerLogin"),
        value: summary.registerLogin,
        icon: LogIn,
        level: "visitor",
      },
      {
        key: "application",
        label: t("application"),
        value: summary.application,
        icon: UserPlus,
        level: "visitor",
      },
      {
        key: "approved",
        label: t("approved"),
        value: summary.approved,
        icon: BadgeEuro,
        level: "user",
      },
      {
        key: "checkout",
        label: t("checkout"),
        value: summary.checkout,
        icon: CreditCard,
        level: "user",
      },
      {
        key: "purchase",
        label: t("purchase"),
        value: summary.purchase,
        icon: BadgeEuro,
        level: "user",
      },
    ];
  }, [summary, t]);

  const maxStage = Math.max(0, ...stages.map((s) => s.value));
  const transitions = stages.slice(1).map((stage, index) => {
    const previous = stages[index];
    return { from: previous.label, to: stage.label, ...dropOff(previous.value, stage.value) };
  });
  const insights = summary ? getSiteFunnelInsights(summary) : [];
  const updatedAtLabel = generatedAt
    ? new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "de-DE", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(generatedAt))
    : null;

  if (loading && !summary) {
    return (
      <Card className="!rounded-2xl">
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-bosporus" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="!rounded-2xl border border-red-100 bg-red-50">
        <div className="flex flex-col items-center py-10 text-center">
          <AlertTriangle className="mb-3 h-8 w-8 text-red-600" />
          <p className="font-bold text-red-900">
            {error === "auth" ? t("authError") : t("loadError")}
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-4 bg-white" onClick={retry}>
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </Button>
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  const isEmpty =
    summary.visitors === 0 && stages.every((s) => s.value === 0) && summary.minOrderBlocked === 0;

  const activeSources = summary.sources.filter(
    (row) =>
      row.visitor + row.view + row.cart + row.register + row.application + row.approved + row.checkout + row.purchase >
      0
  );
  const activeDevices = summary.devices.filter(
    (row) => row.view + row.cart + row.register + row.checkout + row.purchase > 0
  );

  const kpiCards = [
    {
      label: t("visitors"),
      value: summary.visitors,
      previous: summary.previous.visitors,
      spark: summary.trend.map((p) => p.visitors),
      icon: Users,
    },
    {
      label: t("sessions"),
      value: summary.sessions,
      previous: summary.previous.sessions,
      spark: [],
      icon: Globe,
    },
    {
      label: t("productView"),
      value: summary.productView,
      previous: summary.previous.productView,
      spark: summary.trend.map((p) => p.productView),
      icon: Eye,
    },
    {
      label: t("addToCart"),
      value: summary.addToCart,
      previous: summary.previous.addToCart,
      spark: summary.trend.map((p) => p.addToCart),
      icon: ShoppingCart,
    },
    {
      label: t("registerLogin"),
      value: summary.registerLogin,
      previous: summary.previous.registerLogin,
      spark: summary.trend.map((p) => p.registerLogin),
      icon: LogIn,
    },
    {
      label: t("application"),
      value: summary.application,
      previous: summary.previous.application,
      spark: summary.trend.map((p) => p.application),
      icon: UserPlus,
    },
    {
      label: t("approved"),
      value: summary.approved,
      previous: summary.previous.approved,
      spark: summary.trend.map((p) => p.approved),
      icon: BadgeEuro,
    },
    {
      label: t("checkout"),
      value: summary.checkout,
      previous: summary.previous.checkout,
      spark: summary.trend.map((p) => p.checkout),
      icon: CreditCard,
    },
    {
      label: t("purchase"),
      value: summary.purchase,
      previous: summary.previous.purchase,
      spark: summary.trend.map((p) => p.purchase),
      icon: BadgeEuro,
    },
    {
      label: t("minOrderShort"),
      value: summary.minOrderBlocked,
      previous: summary.previous.minOrderBlocked,
      spark: [],
      icon: AlertTriangle,
    },
  ];

  const sourceLabels: Record<AcquisitionSource, string> = {
    google_ads: t("sourceGoogleAds"),
    facebook: t("sourceFacebook"),
    instagram: t("sourceInstagram"),
    tiktok: t("sourceTikTok"),
    organic: t("sourceOrganic"),
    direct: t("sourceDirect"),
    referral: t("sourceReferral"),
    unknown: t("sourceUnknown"),
  };
  const deviceLabels: Record<DeviceBucket, string> = {
    mobile: t("deviceMobile"),
    tablet: t("deviceTablet"),
    desktop: t("deviceDesktop"),
    unknown: t("deviceUnknown"),
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card className="!rounded-2xl border border-blue-100 bg-blue-50/60">
        <div className="flex gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
          <div>
            <p className="font-bold text-blue-950">{t("levelNoteTitle")}</p>
            <p className="mt-1 text-sm text-blue-900/80">{t("levelNoteText")}</p>
          </div>
        </div>
      </Card>

      {isEmpty && (
        <Card className="!rounded-2xl border border-amber-100 bg-amber-50">
          <div className="flex gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-950">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-amber-900/75">{t("emptyText")}</p>
            </div>
          </div>
        </Card>
      )}

      <FunnelTrendChart
        data={summary.trend}
        locale={locale}
        title={days === 1 ? t("trendTitleHours") : t("trendTitle", { days })}
        emptyLabel={t("noTrendData")}
        granularity={summary.granularity}
        defaultMetric="visitors"
        metrics={[
          { key: "visitors", color: "#0f766e", label: t("visitors") },
          { key: "productView", color: "#0891b2", label: t("productView") },
          { key: "addToCart", color: "#d97706", label: t("addToCart") },
          { key: "registerLogin", color: "#2563eb", label: t("registerLogin") },
          { key: "application", color: "#7c3aed", label: t("application") },
          { key: "approved", color: "#0d9488", label: t("approved") },
          { key: "checkout", color: "#9333ea", label: t("checkout") },
          { key: "purchase", color: "#059669", label: t("purchase") },
        ]}
      />

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-metro-navy">{t("kpiTitle")}</h2>
            <p className="text-xs text-bosporus-muted">{tAdmin("periodComparisonHint")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          {kpiCards.map(({ label, value, previous, spark, icon: Icon }) => {
            const delta = periodDelta(value, previous);
            return (
              <Card key={label} className="!rounded-2xl" padding="sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-bosporus-gray-100 text-bosporus">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-2xl font-black tracking-tight text-metro-navy">
                  {numberFormatter.format(value)}
                </p>
                <p className="mt-1 min-h-8 text-xs font-bold leading-4 text-bosporus-muted">{label}</p>
                <PeriodDeltaBadge
                  delta={delta}
                  formatAbsolute={(n) => numberFormatter.format(n)}
                  formatPercent={(n) => percentFormatter.format(n)}
                  vsLabel={tAdmin("vsPreviousPeriod")}
                />
                <KpiSparkline
                  values={spark}
                  positive={delta.absolute === 0 ? null : delta.absolute > 0}
                />
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="!rounded-2xl overflow-hidden" padding="none">
        <div className="border-b border-bosporus-gray-100 p-4 sm:p-6">
          <h2 className="font-extrabold text-metro-navy">{t("funnelVisualization")}</h2>
          <p className="text-xs text-bosporus-muted">{t("funnelSubtitle")}</p>
          <p className="mt-1 text-xs text-bosporus-muted">{tAdmin("independentMetricsNote")}</p>
        </div>
        <div className="space-y-0 p-4 sm:p-6">
          {stages.map((stage, index) => {
            const previous = index === 0 ? null : stages[index - 1];
            const previousRate =
              index === 0
                ? stage.value > 0
                  ? 100
                  : null
                : stageShare(stage.value, previous?.value ?? 0);
            const totalRate =
              index === 0
                ? stage.value > 0
                  ? 100
                  : null
                : stageShare(stage.value, stages[0]?.value ?? 0);
            const width =
              stage.value === 0 || maxStage === 0
                ? 0
                : Math.max(7, (stage.value / maxStage) * 100);
            const Icon = stage.icon;
            return (
              <div key={stage.key}>
                {previous && (
                  <div className="flex items-center justify-center gap-2 py-2.5">
                    <ArrowDown className="h-4 w-4 shrink-0 text-bosporus-gray-300" />
                    <span className="text-xs font-semibold text-bosporus-muted">
                      {t("dropOff")}:{" "}
                      {numberFormatter.format(dropOff(previous.value, stage.value).count)} (
                      {formatPercentage(dropOff(previous.value, stage.value).percentage)})
                    </span>
                  </div>
                )}
                <div
                  className="relative w-full overflow-hidden rounded-2xl border border-bosporus-gray-100 bg-bosporus-gray-50 sm:w-[var(--w)]"
                  style={{ "--w": `${Math.max(54, width)}%` } as CSSProperties}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-bosporus/15 to-bosporus-yellow/25"
                    style={{ width: `${width}%` }}
                    aria-hidden="true"
                  />
                  <div className="relative grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Icon className="h-5 w-5 text-bosporus" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-metro-navy">{stage.label}</p>
                        <p className="text-xs text-bosporus-muted">
                          {stage.level === "user" ? t("levelUser") : t("levelVisitor")}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[auto_auto] items-end gap-x-4">
                      <p className="row-span-2 text-2xl font-black text-metro-navy">
                        {numberFormatter.format(stage.value)}
                      </p>
                      <p className="text-right text-xs text-bosporus-muted">{tAdmin("previousShare")}</p>
                      <p className="text-right text-sm font-extrabold text-bosporus">
                        {formatPercentage(previousRate)}
                        <span className="ml-2 font-medium text-bosporus-muted">
                          · {tAdmin("totalShare")} {formatPercentage(totalRate)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="!rounded-2xl overflow-hidden" padding="none">
        <div className="border-b border-bosporus-gray-100 p-4 sm:p-6">
          <h2 className="font-extrabold text-metro-navy">{t("sourceBreakdown")}</h2>
          <p className="text-xs text-bosporus-muted">{t("sourceBreakdownSubtitle")}</p>
        </div>
        <div className="overflow-x-auto">
          {activeSources.length === 0 ? (
            <p className="p-6 text-sm font-semibold text-bosporus-muted">{t("sourceNoData")}</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-bosporus-gray-100 text-left text-xs text-bosporus-muted">
                  <th className="p-3 font-semibold">{t("sourceColumn")}</th>
                  <th className="p-3 text-right font-semibold">{t("visitorShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("viewShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("cartShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("registerShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("applicationShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("approvedShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("checkoutShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("purchaseShort")}</th>
                </tr>
              </thead>
              <tbody>
                {activeSources.map((row) => (
                  <tr key={row.source} className="border-b border-bosporus-gray-50 last:border-0">
                    <td className="p-3 font-bold text-metro-navy">{sourceLabels[row.source]}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.visitor)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.view)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.cart)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.register)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.application)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.approved)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.checkout)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {numberFormatter.format(row.purchase)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="border-t border-bosporus-gray-100 p-3 text-xs text-bosporus-muted">
          {t("firstTouchNote")}
        </p>
      </Card>

      <Card className="!rounded-2xl overflow-hidden" padding="none">
        <div className="border-b border-bosporus-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="h-5 w-5 text-bosporus" />
            <h2 className="font-extrabold text-metro-navy">{t("deviceBreakdown")}</h2>
          </div>
          <p className="text-xs text-bosporus-muted">{t("deviceBreakdownSubtitle")}</p>
        </div>
        <div className="overflow-x-auto">
          {activeDevices.length === 0 ? (
            <p className="p-6 text-sm font-semibold text-bosporus-muted">{t("notCollectedYet")}</p>
          ) : (
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-bosporus-gray-100 text-left text-xs text-bosporus-muted">
                  <th className="p-3 font-semibold">{t("deviceColumn")}</th>
                  <th className="p-3 text-right font-semibold">{t("viewShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("cartShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("registerShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("checkoutShort")}</th>
                  <th className="p-3 text-right font-semibold">{t("purchaseShort")}</th>
                </tr>
              </thead>
              <tbody>
                {activeDevices.map((row) => (
                  <tr key={row.device} className="border-b border-bosporus-gray-50 last:border-0">
                    <td className="p-3 font-bold text-metro-navy">{deviceLabels[row.device]}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.view)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.cart)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.register)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.checkout)}</td>
                    <td className="p-3 text-right">{numberFormatter.format(row.purchase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card className="!rounded-2xl">
        <h2 className="font-extrabold text-metro-navy">{t("dropOffAnalysis")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {transitions.map((transition) => (
            <div key={`${transition.from}-${transition.to}`} className="rounded-xl bg-bosporus-gray-50 p-4">
              <p className="text-xs font-semibold text-bosporus-muted">
                {transition.from} → {transition.to}
              </p>
              <p className="mt-2 text-2xl font-black text-metro-navy">
                {numberFormatter.format(transition.count)}
              </p>
              <p className="text-xs font-bold text-rose-700">
                {formatPercentage(transition.percentage)} {t("dropOff")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!rounded-2xl">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-bosporus-yellow-dark" />
          <h2 className="font-extrabold text-metro-navy">{t("insights")}</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <div
              key={insight}
              className="rounded-xl border border-bosporus-gray-100 bg-bosporus-gray-50 p-4 text-sm leading-6 text-bosporus-gray-800"
            >
              {t(INSIGHT_KEYS[insight])}
            </div>
          ))}
        </div>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-bosporus-muted">
        <Clock3 className="h-3.5 w-3.5" />
        {updatedAtLabel ? t("lastUpdated", { time: updatedAtLabel }) : t("notUpdatedYet")}
      </p>
    </div>
  );
}
