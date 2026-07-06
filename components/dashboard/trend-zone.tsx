import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyCheckin } from "@/types/database";

interface TrendZoneProps {
  recentCheckins: DailyCheckin[];
}

export function TrendZone({ recentCheckins }: TrendZoneProps) {
  if (recentCheckins.length < 2) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardDescription>Weekly Trend / 本周趋势</CardDescription>
          <CardTitle className="text-base font-medium text-muted-foreground">
            Record more days to see trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            记录更多天后显示趋势。至少需要 2 天经营打卡数据。
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...recentCheckins].sort(
    (a, b) => a.checkin_date.localeCompare(b.checkin_date)
  );
  const revenues = sorted.map((c) => Number(c.revenue));
  const max = Math.max(...revenues, 1);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Weekly Trend / 本周趋势</CardDescription>
        <CardTitle className="text-base font-medium">
          Last {sorted.length} days revenue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-1 h-16">
          {revenues.map((rev, i) => (
            <div
              key={sorted[i].checkin_date}
              className="flex-1 rounded-t bg-primary/70 min-w-[8px]"
              style={{ height: `${Math.max(8, (rev / max) * 100)}%` }}
              title={`${sorted[i].checkin_date}: ¥${rev}`}
            />
          ))}
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {sorted
            .slice()
            .reverse()
            .map((c) => (
              <li
                key={c.id}
                className="flex justify-between"
              >
                <span>{c.checkin_date}</span>
                <span>¥{Number(c.revenue).toLocaleString()} · {c.customer_count} customers</span>
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
