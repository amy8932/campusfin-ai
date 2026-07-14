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
import type { CampusContext } from "@/lib/campus/context";
import {
  buildCampusSignals,
  buildTrafficSignal,
} from "@/lib/campus/signals";

interface CampusZoneProps {
  context: CampusContext;
  todayStr: string;
}

export function CampusZone({ context, todayStr }: CampusZoneProps) {
  const signals = buildCampusSignals(context, todayStr);
  const traffic = buildTrafficSignal(context);

  return (
    <Card className={dashboardCardClass}>
      <CardHeader className="pb-2">
        <CardDescription className={dashboardCaptionClass}>
          Today&apos;s Campus / 今日校园
        </CardDescription>
        <h2 className={dashboardSectionClass}>今天校园发生了什么</h2>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {signals.length > 0 ? (
          <ul className="space-y-3">
            {signals.map((signal) => (
              <li key={`${signal.emoji}-${signal.title}`} className="flex gap-3">
                <span className="text-lg leading-none" aria-hidden>
                  {signal.emoji}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className={`${dashboardCardTitleClass} text-[15px]`}>
                    {signal.title}
                  </p>
                  <p className={dashboardCaptionClass}>{signal.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={dashboardBodyClass}>
            {context.headlineZh}
          </p>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
          <div>
            <p className={dashboardCaptionClass}>Traffic / 客流预期</p>
            <p className={`${dashboardCardTitleClass} text-[15px]`}>
              {traffic.label}
            </p>
          </div>
          <p className={`${dashboardBodyClass} text-gray-500`}>
            {traffic.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
