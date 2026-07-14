import {
  computeCheckinStreak,
  formatDashboardDate,
} from "@/lib/dashboard/display";
import { BUSINESS_GOAL_LABELS } from "@/lib/health";
import type { Business, DailyCheckin } from "@/types/database";

interface BusinessHeaderProps {
  business: Business;
  todayStr: string;
  recentCheckins: DailyCheckin[];
}

export function BusinessHeader({
  business,
  todayStr,
  recentCheckins,
}: BusinessHeaderProps) {
  const { weekday, shortDate } = formatDashboardDate(
    todayStr,
    business.business_timezone
  );
  const streak = computeCheckinStreak(recentCheckins, todayStr);
  const goal = BUSINESS_GOAL_LABELS[business.business_goal];

  return (
    <header className="space-y-3 rounded-xl border border-primary/20 bg-muted/10 px-4 py-4">
      <div className="space-y-1">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight">
          {business.name}
        </h1>
        <p className="text-[15px] text-gray-500">{business.campus_name}</p>
        <p className="text-[13px] text-gray-500">
          {weekday} · {shortDate}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-gray-500">Goal / 经营目标</p>
          <p className="text-[17px] font-semibold">{goal}</p>
        </div>
        {streak >= 2 && (
          <p className="text-[15px] font-medium">
            🔥 {streak}-day check-in streak
            <span className="ml-1.5 text-[13px] font-normal text-gray-500">
              连续打卡 {streak} 天
            </span>
          </p>
        )}
      </div>
    </header>
  );
}
