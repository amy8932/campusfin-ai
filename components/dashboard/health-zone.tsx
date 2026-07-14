import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  dashboardBodyClass,
  dashboardCaptionClass,
  dashboardCardClass,
  dashboardCardTitleClass,
  dashboardSectionClass,
} from "@/components/dashboard/dashboard-styles";
import {
  buildMetricComparison,
  findPreviousCheckin,
  HEALTH_STATUS_DISPLAY,
  resolveHealthStatus,
} from "@/lib/dashboard/display";
import { computeHealthLabel } from "@/lib/health";
import type { DailyCheckin } from "@/types/database";
import { cn } from "@/lib/utils";

interface HealthZoneProps {
  todayCheckin: DailyCheckin | null;
  recentCheckins: DailyCheckin[];
  todayStr: string;
}

export function HealthZone({
  todayCheckin,
  recentCheckins,
  todayStr,
}: HealthZoneProps) {
  const previous = todayCheckin
    ? findPreviousCheckin(recentCheckins, todayStr)
    : null;

  const revenues = recentCheckins.map((c) => Number(c.revenue));
  const avgRevenue =
    revenues.length > 0
      ? revenues.reduce((a, b) => a + b, 0) / revenues.length
      : null;

  const healthLabel = todayCheckin
    ? computeHealthLabel(Number(todayCheckin.revenue), avgRevenue)
    : "no_data";

  const revenueRatio =
    todayCheckin && avgRevenue && avgRevenue > 0
      ? Number(todayCheckin.revenue) / avgRevenue
      : null;

  const statusLevel =
    healthLabel !== "no_data"
      ? resolveHealthStatus(healthLabel, revenueRatio)
      : null;
  const statusDisplay = statusLevel
    ? HEALTH_STATUS_DISPLAY[statusLevel]
    : null;

  const revenueMetric = todayCheckin
    ? buildMetricComparison(
        Number(todayCheckin.revenue),
        previous ? Number(previous.revenue) : null,
        "¥"
      )
    : null;

  const customerMetric = todayCheckin
    ? buildMetricComparison(
        todayCheckin.customer_count,
        previous ? previous.customer_count : null,
        ""
      )
    : null;

  return (
    <Card className={dashboardCardClass}>
      <CardHeader className="pb-2">
        <CardDescription className={dashboardCaptionClass}>
          Business Health / 经营状态
        </CardDescription>
        <h2 className={dashboardSectionClass}>今天经营怎么样</h2>
      </CardHeader>
      <CardContent className="pt-0">
        {!todayCheckin ? (
          <div className="space-y-3">
            <p className={`${dashboardBodyClass} text-gray-500`}>
              完成今日经营打卡后查看经营数据。
              <span className="ml-1">Complete Daily Check-in first.</span>
            </p>
            <Button render={<Link href="/dashboard/record" />}>
              Daily Check-in / 今日经营打卡
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricBlock
              label="Revenue / 营业额"
              metric={revenueMetric!}
            />
            <MetricBlock
              label="Customers / 客流"
              metric={customerMetric!}
            />
            {statusDisplay && (
              <div className="rounded-lg border border-border/30 px-3 py-2.5">
                <p className={dashboardCaptionClass}>Status / 状态</p>
                <span
                  className={cn(
                    "mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[13px] font-medium",
                    statusDisplay.className
                  )}
                >
                  {statusDisplay.zh}
                  <span className="ml-1 font-normal opacity-80">
                    {statusDisplay.en}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBlock({
  label,
  metric,
}: {
  label: string;
  metric: { value: string; delta: string | null; deltaPositive: boolean | null };
}) {
  return (
    <div className="rounded-lg border border-border/30 px-3 py-2.5">
      <p className={dashboardCaptionClass}>{label}</p>
      <p className={`mt-1 ${dashboardCardTitleClass}`}>{metric.value}</p>
      {metric.delta && (
        <p
          className={cn(
            "mt-0.5 text-[13px]",
            metric.deltaPositive === true && "text-emerald-600",
            metric.deltaPositive === false && "text-amber-600",
            metric.deltaPositive === null && "text-gray-500"
          )}
        >
          {metric.delta}
        </p>
      )}
    </div>
  );
}
