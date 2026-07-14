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
  dashboardSectionClass,
} from "@/components/dashboard/dashboard-styles";
import type { DailyCheckin } from "@/types/database";

interface TrendZoneProps {
  recentCheckins: DailyCheckin[];
}

function MiniTrend({
  label,
  values,
  formatValue,
}: {
  label: string;
  values: number[];
  formatValue: (n: number) => string;
}) {
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-2">
      <p className={dashboardCaptionClass}>{label}</p>
      <div className="flex h-12 items-end gap-1">
        {values.map((value, i) => (
          <div
            key={i}
            className="flex-1 min-w-[6px] rounded-t bg-primary/60"
            style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
            title={formatValue(value)}
          />
        ))}
      </div>
    </div>
  );
}

export function TrendZone({ recentCheckins }: TrendZoneProps) {
  if (recentCheckins.length < 2) {
    return (
      <Card className={`${dashboardCardClass} border-dashed`}>
        <CardHeader className="pb-2">
          <CardDescription className={dashboardCaptionClass}>
            Weekly Trend / 本周趋势
          </CardDescription>
          <h2 className={`${dashboardSectionClass} text-gray-500`}>
            数据还不够看趋势
          </h2>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={`${dashboardBodyClass} text-gray-500`}>
            再打卡 1–2 天，CampusFin 会在这里展示营业额和客流变化。
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...recentCheckins].sort((a, b) =>
    a.checkin_date.localeCompare(b.checkin_date)
  );
  const revenues = sorted.map((c) => Number(c.revenue));
  const customers = sorted.map((c) => c.customer_count);
  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];
  const revenueDelta = Number(latest.revenue) - Number(earliest.revenue);
  const customerDelta = latest.customer_count - earliest.customer_count;

  return (
    <Card className={dashboardCardClass}>
      <CardHeader className="pb-2">
        <CardDescription className={dashboardCaptionClass}>
          Weekly Trend / 本周趋势
        </CardDescription>
        <h2 className={dashboardSectionClass}>近 {sorted.length} 天走势</h2>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <MiniTrend
          label="Revenue / 营业额"
          values={revenues}
          formatValue={(n) => `¥${n.toLocaleString("zh-CN")}`}
        />
        <MiniTrend
          label="Customers / 客流"
          values={customers}
          formatValue={(n) => `${n} 人`}
        />
        <p className={dashboardCaptionClass}>
          {sorted.length} 天对比：
          营业额 {revenueDelta >= 0 ? "+" : ""}¥
          {Math.abs(revenueDelta).toLocaleString("zh-CN")}，
          客流 {customerDelta >= 0 ? "+" : ""}
          {customerDelta} 人
        </p>
      </CardContent>
    </Card>
  );
}
