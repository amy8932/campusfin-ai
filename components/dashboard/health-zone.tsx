import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  computeHealthLabel,
  HEALTH_LABEL_DISPLAY,
  type HealthLabel,
} from "@/lib/health";
import type { DailyCheckin } from "@/types/database";

interface HealthZoneProps {
  todayCheckin: DailyCheckin | null;
  recentCheckins: DailyCheckin[];
}

export function HealthZone({ todayCheckin, recentCheckins }: HealthZoneProps) {
  const revenues = recentCheckins.map((c) => Number(c.revenue));
  const avgRevenue =
    revenues.length > 0
      ? revenues.reduce((a, b) => a + b, 0) / revenues.length
      : null;

  const healthLabel: HealthLabel = todayCheckin
    ? computeHealthLabel(Number(todayCheckin.revenue), avgRevenue)
    : "no_data";

  const healthDisplay =
    healthLabel !== "no_data" ? HEALTH_LABEL_DISPLAY[healthLabel] : null;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Business Health / 经营状态</CardDescription>
        <CardTitle className="text-lg">
          {healthDisplay ? healthDisplay.zh : "暂无数据"}
          {healthDisplay && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {healthDisplay.en}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!todayCheckin ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete Daily Check-in to see today&apos;s numbers.
              <br />
              完成今日经营打卡后查看经营数据。
            </p>
            <Button render={<Link href="/dashboard/record" />}>
              Daily Check-in / 今日经营打卡
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Revenue / 营业额"
              value={`¥${Number(todayCheckin.revenue).toLocaleString()}`}
            />
            <Metric
              label="Customers / 客流"
              value={String(todayCheckin.customer_count)}
            />
            <Metric
              label="Health / 评分"
              value={healthDisplay?.zh ?? "—"}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
