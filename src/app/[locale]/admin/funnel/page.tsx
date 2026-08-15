"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowDown,
  BadgeEuro,
  Clock3,
  CreditCard,
  Eye,
  Funnel,
  Heart,
  Lightbulb,
  Loader2,
  LogIn,
  MonitorSmartphone,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  UserCheck,
  Zap,
} from "lucide-react";
import { FunnelTrendChart } from "@/components/admin/FunnelTrendChart";
import { FunnelSourceBreakdown } from "@/components/admin/FunnelSourceBreakdown";
import { VisitorFunnelView } from "@/components/admin/VisitorFunnelView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  dropOff,
  getFunnelInsights,
  percentage,
  type B2bFunnelResponse,
  type B2bFunnelSummary,
  type FunnelDays,
  type FunnelInsight,
} from "@/lib/b2b-funnel-dashboard";

const DATE_RANGES: FunnelDays[] = [7, 30, 90];
const KPI_TONES: Record<string, { icon: string; accent: string }> = {
  teal: { icon: "bg-teal-50 text-teal-700", accent: "from-teal-500 to-teal-300" },
  blue: { icon: "bg-blue-50 text-blue-700", accent: "from-blue-500 to-blue-300" },
  cyan: { icon: "bg-cyan-50 text-cyan-700", accent: "from-cyan-500 to-cyan-300" },
  amber: { icon: "bg-amber-50 text-amber-700", accent: "from-amber-500 to-amber-300" },
  violet: { icon: "bg-violet-50 text-violet-700", accent: "from-violet-500 to-violet-300" },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700",
    accent: "from-emerald-500 to-emerald-300",
  },
  orange: { icon: "bg-orange-50 text-orange-700", accent: "from-orange-500 to-orange-300" },
};

const INSIGHT_TRANSLATION_KEYS: Record<FunnelInsight, string> = {
  lowReturnAfterApproval: "lowReturnAfterApproval",
  cartCheckoutDropoff: "cartCheckoutDropoff",
  checkoutWithoutPurchase: "checkoutWithoutPurchase",
  minOrderFriction: "minOrderFriction",
  waitingForData: "waitingForDataInsight",
};

type LoadError = "auth" | "generic" | null;
type FunnelTab = "visitor" | "b2b";

export default function AdminFunnelPage() {
  const t = useTranslations("adminFunnel");
  const locale = useLocale();
  const [tab, setTab] = useState<FunnelTab>("visitor");
  const [days, setDays] = useState<FunnelDays>(30);
  const [summary, setSummary] = useState<B2bFunnelSummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectDays = (range: FunnelDays) => {
    if (range === days) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    setDays(range);
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/admin/b2b-funnel?days=${days}`, {
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

        const data = (await response.json()) as B2bFunnelResponse;
        const selected = data.windows[String(days) as `${FunnelDays}`];
        if (!selected?.ok) {
          setError("generic");
          return;
        }

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
  }, [days, reloadKey]);

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
      { key: "approved", label: t("approved"), value: summary.approved, icon: Funnel },
      {
        key: "firstLogin",
        label: t("firstLogin"),
        value: summary.firstLoginAfterApproval,
        icon: LogIn,
      },
      { key: "viewItem", label: t("viewItem"), value: summary.viewItem, icon: Eye },
      {
        key: "addToCart",
        label: t("addToCart"),
        value: summary.addToCart,
        icon: ShoppingCart,
      },
      { key: "checkout", label: t("checkout"), value: summary.checkout, icon: CreditCard },
      { key: "purchase", label: t("purchase"), value: summary.purchase, icon: BadgeEuro },
    ];
  }, [summary, t]);

  const maximumStageValue = Math.max(0, ...stages.map((stage) => stage.value));
  const isEmpty =
    summary !== null &&
    stages.every((stage) => stage.value === 0) &&
    summary.minOrderBlocked === 0 &&
    summary.quickOrder === 0 &&
    summary.favorite === 0;
  const insights = summary ? getFunnelInsights(summary) : [];
  const minOrderRate = summary
    ? percentage(summary.minOrderBlocked, summary.approved)
    : null;
  const purchaseRate = summary ? percentage(summary.purchase, summary.approved) : null;
  const kpiCards = summary
    ? [
        { label: t("approved"), value: summary.approved, icon: UserCheck, tone: "teal" },
        {
          label: t("firstLogin"),
          value: summary.firstLoginAfterApproval,
          icon: LogIn,
          tone: "blue",
        },
        { label: t("viewItem"), value: summary.viewItem, icon: Eye, tone: "cyan" },
        {
          label: t("addToCart"),
          value: summary.addToCart,
          icon: ShoppingCart,
          tone: "amber",
        },
        { label: t("checkout"), value: summary.checkout, icon: CreditCard, tone: "violet" },
        { label: t("purchase"), value: summary.purchase, icon: BadgeEuro, tone: "emerald" },
        {
          label: t("minOrderShort"),
          value: summary.minOrderBlocked,
          icon: AlertTriangle,
          tone: "orange",
        },
      ]
    : [];
  const transitions = stages.slice(1).map((stage, index) => {
    const previous = stages[index];
    return {
      from: previous?.label ?? "",
      to: stage.label,
      ...dropOff(previous?.value ?? 0, stage.value),
    };
  });
  const largestDrop = transitions.reduce<(typeof transitions)[number] | null>(
    (largest, transition) =>
      transition.percentage !== null &&
      (largest?.percentage === null ||
        largest === null ||
        transition.percentage > (largest.percentage ?? -1))
        ? transition
        : largest,
    null
  );
  const updatedAtLabel = generatedAt
    ? new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "de-DE", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(generatedAt))
    : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-metro-navy">{t("title")}</h1>
          <p className="mt-1 text-sm text-bosporus-muted">{t("subtitle")}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-bosporus-muted">
            <Clock3 className="h-3.5 w-3.5" />
            {updatedAtLabel
              ? t("lastUpdated", { time: updatedAtLabel })
              : t("notUpdatedYet")}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
          <div
            className="inline-flex w-full rounded-xl bg-bosporus-gray-100 p-1 sm:w-auto"
            aria-label={t("title")}
          >
            {DATE_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => selectDays(range)}
                aria-pressed={days === range}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors sm:flex-none sm:px-4",
                  days === range
                    ? "bg-white text-metro-navy shadow-sm"
                    : "text-bosporus-muted hover:text-metro-navy"
                )}
              >
                {t("days", { count: range })}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={loading}
            onClick={retry}
            className="bg-white"
          >
            {!loading && <RefreshCw className="h-4 w-4" />}
            {t("refresh")}
          </Button>
        </div>
      </div>

      <div
        className="inline-flex w-full rounded-xl bg-bosporus-gray-100 p-1 sm:w-auto"
        role="tablist"
        aria-label={t("title")}
      >
        {(["visitor", "b2b"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "min-w-0 flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors sm:flex-none",
              tab === value
                ? "bg-white text-metro-navy shadow-sm"
                : "text-bosporus-muted hover:text-metro-navy"
            )}
          >
            {value === "visitor" ? t("tabVisitors") : t("tabApprovedB2b")}
          </button>
        ))}
      </div>

      {tab === "visitor" ? (
        <VisitorFunnelView days={days} locale={locale} reloadSignal={reloadKey} />
      ) : loading && !summary ? (
        <Card className="!rounded-2xl">
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-bosporus" />
          </div>
        </Card>
      ) : error ? (
        <Card className="!rounded-2xl border border-red-100 bg-red-50">
          <div className="flex flex-col items-center py-10 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-red-600" />
            <p className="font-bold text-red-900">
              {error === "auth" ? t("authError") : t("loadError")}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-4 bg-white"
              onClick={retry}
            >
              <RefreshCw className="h-4 w-4" />
              {t("retry")}
            </Button>
          </div>
        </Card>
      ) : summary ? (
        <>
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
            title={t("trendTitle", { days })}
            emptyLabel={t("noTrendData")}
            metricLabels={{
              approved: t("approved"),
              firstLoginAfterApproval: t("firstLogin"),
              addToCart: t("addToCart"),
              checkout: t("checkout"),
              purchase: t("purchase"),
            }}
          />

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-metro-navy">{t("kpiTitle")}</h2>
                <p className="text-xs text-bosporus-muted">{t("kpiSubtitle")}</p>
              </div>
              <span className="hidden text-xs font-semibold text-bosporus-muted sm:block">
                {t("previousPeriodUnavailable")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {kpiCards.map(({ label, value, icon: Icon, tone }) => {
                const colors = KPI_TONES[tone] ?? KPI_TONES.teal;
                return (
                  <Card
                    key={label}
                    className="relative !rounded-2xl overflow-hidden"
                    padding="sm"
                  >
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                        colors.accent
                      )}
                    />
                    <div
                      className={cn(
                        "mb-4 flex h-9 w-9 items-center justify-center rounded-xl",
                        colors.icon
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-3xl font-black tracking-tight text-metro-navy">
                      {numberFormatter.format(value)}
                    </p>
                    <p className="mt-1 min-h-10 text-xs font-bold leading-5 text-bosporus-muted">
                      {label}
                    </p>
                  </Card>
                );
              })}
            </div>
          </section>

          <Card className="!rounded-2xl overflow-hidden" padding="none">
            <div className="border-b border-bosporus-gray-100 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Funnel className="h-5 w-5 text-bosporus" />
                <div>
                  <h2 className="font-extrabold text-metro-navy">
                    {t("funnelVisualization")}
                  </h2>
                  <p className="text-xs text-bosporus-muted">{t("funnelSubtitle")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-0 p-4 sm:p-6">
              {stages.map((stage, index) => {
                const previous = index === 0 ? null : stages[index - 1];
                const previousRate =
                  index === 0
                    ? stage.value > 0
                      ? 100
                      : null
                    : percentage(stage.value, previous?.value ?? 0);
                const totalRate =
                  index === 0
                    ? stage.value > 0
                      ? 100
                      : null
                    : percentage(stage.value, stages[0]?.value ?? 0);
                const width =
                  stage.value === 0 || maximumStageValue === 0
                    ? 0
                    : Math.max(7, (stage.value / maximumStageValue) * 100);
                const Icon = stage.icon;

                return (
                  <div key={stage.key}>
                    {previous && (() => {
                      const transition = dropOff(previous.value, stage.value);
                      return (
                        <div className="flex items-center justify-center gap-3 py-2.5">
                          <ArrowDown className="h-4 w-4 shrink-0 text-bosporus-gray-300" />
                          <span className="text-xs font-semibold text-bosporus-muted">
                            {t("dropOff")}: {numberFormatter.format(transition.count)} (
                            {formatPercentage(transition.percentage)})
                          </span>
                        </div>
                      );
                    })()}

                    <div
                      className="relative mx-auto w-full overflow-hidden rounded-2xl border border-bosporus-gray-100 bg-bosporus-gray-50 transition-[width] sm:w-[var(--stage-width)] sm:[clip-path:polygon(2%_0,98%_0,95%_100%,5%_100%)]"
                      style={
                        {
                          "--stage-width": `${Math.max(54, width)}%`,
                        } as CSSProperties
                      }
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-bosporus/15 to-bosporus-yellow/25 transition-[width] duration-500"
                        style={{ width: `${width}%` }}
                        aria-hidden="true"
                      />
                      <div className="relative grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Icon className="h-5 w-5 text-bosporus" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-metro-navy">
                              {stage.label}
                            </p>
                            <p className="text-xs text-bosporus-muted">{t("distinctUsers")}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-[auto_auto] items-end gap-x-4 sm:gap-x-6">
                          <p className="row-span-2 text-3xl font-black text-metro-navy">
                            {numberFormatter.format(stage.value)}
                          </p>
                          <p className="text-right text-xs text-bosporus-muted">
                            {t("previousConversion")}
                          </p>
                          <p className="text-right text-sm font-extrabold text-bosporus">
                            {formatPercentage(previousRate)}
                            <span className="ml-2 font-medium text-bosporus-muted">
                              · {t("totalConversion")} {formatPercentage(totalRate)}
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

          <section>
            <div className="mb-3">
              <h2 className="text-lg font-extrabold text-metro-navy">{t("breakdownTitle")}</h2>
              <p className="text-xs text-bosporus-muted">{t("breakdownSubtitle")}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="!rounded-2xl border border-dashed border-bosporus-gray-200 bg-bosporus-gray-50/70">
              <MonitorSmartphone className="mb-3 h-6 w-6 text-bosporus-muted" />
              <h2 className="font-extrabold text-metro-navy">{t("deviceBreakdown")}</h2>
              <p className="mt-3 text-sm font-semibold text-bosporus-muted">
                {t("notCollectedYet")}
              </p>
            </Card>

            <FunnelSourceBreakdown
              data={summary.sources ?? []}
              title={t("sourceBreakdown")}
              subtitle={t("sourceBreakdownSubtitle")}
              sourceLabel={t("sourceColumn")}
              viewLabel={t("viewShort")}
              cartLabel={t("cartShort")}
              checkoutLabel={t("checkoutShort")}
              purchaseLabel={t("purchaseShort")}
              conversionLabel={t("purchaseConversionShort")}
              noDataLabel={t("sourceNoData")}
              metaLabel={t("metaSummary")}
              firstTouchNote={t("firstTouchNote")}
              labels={{
                google_ads: t("sourceGoogleAds"),
                facebook: t("sourceFacebook"),
                instagram: t("sourceInstagram"),
                tiktok: t("sourceTikTok"),
                organic: t("sourceOrganic"),
                direct: t("sourceDirect"),
                referral: t("sourceReferral"),
                unknown: t("sourceUnknown"),
              }}
              metricLabels={{
                approved: t("approved"),
                addToCart: t("addToCart"),
                checkout: t("checkout"),
                purchase: t("purchase"),
              }}
            />

            <Card className="!rounded-2xl md:col-span-1">
              <AlertTriangle className="mb-3 h-6 w-6 text-orange-600" />
              <h2 className="font-extrabold text-metro-navy">{t("minimumOrder")}</h2>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-black text-metro-navy">
                  {numberFormatter.format(summary.minOrderBlocked)}
                </p>
                <p className="text-sm font-bold text-orange-700">
                  {formatPercentage(minOrderRate)}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-bosporus-muted">
                {t("minimumOrderCopy", {
                  days,
                  count: numberFormatter.format(summary.minOrderBlocked),
                })}
              </p>
            </Card>

            <Card className="!rounded-2xl">
              <Zap className="mb-3 h-6 w-6 text-bosporus" />
              <h2 className="font-extrabold text-metro-navy">{t("quickOrder")}</h2>
              <p className="mt-3 text-3xl font-black text-metro-navy">
                {numberFormatter.format(summary.quickOrder)}
              </p>
              <p className="mt-1 text-sm text-bosporus-muted">{t("distinctUsers")}</p>
            </Card>

            <Card className="!rounded-2xl">
              <Heart className="mb-3 h-6 w-6 text-rose-600" />
              <h2 className="font-extrabold text-metro-navy">{t("favorites")}</h2>
              <p className="mt-3 text-3xl font-black text-metro-navy">
                {numberFormatter.format(summary.favorite)}
              </p>
              <p className="mt-1 text-sm text-bosporus-muted">{t("distinctUsers")}</p>
            </Card>
            </div>
          </section>

          <Card className="!rounded-2xl">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-600" />
              <h2 className="font-extrabold text-metro-navy">{t("dropOffAnalysis")}</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {transitions.map((transition) => (
                <div
                  key={`${transition.from}-${transition.to}`}
                  className="rounded-xl bg-bosporus-gray-50 p-4"
                >
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

          <Card className="!rounded-2xl border border-emerald-100 bg-emerald-50/50">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BadgeEuro className="h-6 w-6 text-emerald-700" />
                  <h2 className="font-extrabold text-metro-navy">{t("onlineSales")}</h2>
                </div>
                {summary.purchase === 0 ? (
                  <p className="mt-3 font-semibold text-emerald-900">{t("noPurchase")}</p>
                ) : (
                  <p className="mt-3 text-sm text-bosporus-muted">{t("purchasingUsers")}</p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-4xl font-black text-metro-navy">
                  {numberFormatter.format(summary.purchase)}
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-800">
                  {t("purchaseConversion")}: {formatPercentage(purchaseRate)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="!rounded-2xl">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-bosporus-yellow-dark" />
                <h2 className="font-extrabold text-metro-navy">{t("insights")}</h2>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                    {t("largestDrop")}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-metro-navy">
                    {largestDrop
                      ? t("largestDropValue", {
                          from: largestDrop.from,
                          to: largestDrop.to,
                          rate: formatPercentage(largestDrop.percentage),
                        })
                      : t("noData")}
                  </p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                    {t("checkoutIntent")}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-metro-navy">
                    {summary.checkout > 0
                      ? t("checkoutIntentDetected", {
                          count: numberFormatter.format(summary.checkout),
                        })
                      : t("checkoutIntentMissing")}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    {t("onlineSales")}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-metro-navy">
                    {summary.purchase > 0
                      ? t("purchaseDetected", {
                          count: numberFormatter.format(summary.purchase),
                        })
                      : t("noPurchase")}
                  </p>
                </div>
              </div>
              {insights.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                {insights.map((insight) => (
                  <div
                    key={insight}
                    className="rounded-xl border border-bosporus-gray-100 bg-bosporus-gray-50 p-4 text-sm leading-6 text-bosporus-gray-800"
                  >
                    {t(INSIGHT_TRANSLATION_KEYS[insight])}
                  </div>
                ))}
                </div>
              )}
            </Card>
        </>
      ) : null}

      <div className="flex flex-col gap-1 text-xs text-bosporus-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t("source")}</p>
      </div>

      {tab === "b2b" && loading && summary && (
        <div className="pointer-events-none fixed bottom-5 right-5 rounded-full bg-metro-navy p-3 text-white shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </div>
  );
}
