import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  dashboardBodyClass,
  dashboardCaptionClass,
  dashboardCardTitleClass,
} from "@/components/dashboard/dashboard-styles";
import type { WeeklyBriefOutput } from "@/lib/ai/weekly-brief";

interface WeeklyBriefCardProps {
  brief: WeeklyBriefOutput | null;
}

function BriefSection({
  title,
  titleZh,
  children,
}: {
  title: string;
  titleZh: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className={`${dashboardCardTitleClass} text-blue-900/80`}>
        {title}
        <span className="ml-1.5 font-normal text-blue-700/50">{titleZh}</span>
      </h3>
      <p className={`${dashboardBodyClass} leading-relaxed text-gray-700`}>
        {children}
      </p>
    </section>
  );
}

function SectionDivider() {
  return <div className="border-t border-blue-100/80" />;
}

export function WeeklyBriefCard({ brief }: WeeklyBriefCardProps) {
  if (!brief) {
    return (
      <Card className="rounded-xl border border-dashed border-blue-200/60 bg-blue-50/20">
        <CardHeader className="pb-2">
          <CardDescription className={dashboardCaptionClass}>
            Weekly Business Brief / 每周经营简报
          </CardDescription>
          <h2 className="text-xl font-semibold text-blue-950/90">
            每周经营简报
          </h2>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={`${dashboardBodyClass} text-gray-500`}>
            再打卡 2 天以上，CampusFin 会生成本周经营简报。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-blue-200/70 bg-gradient-to-b from-blue-50/40 to-background shadow-none">
      <CardHeader className="pb-2">
        <CardDescription className="text-blue-700/60">
          Weekly Business Brief / 每周经营简报
        </CardDescription>
        <h2 className="text-xl font-semibold text-blue-950/90">
          每周经营简报
        </h2>
        <p className={dashboardCaptionClass}>
          {brief.source === "ai" ? "AI 生成" : "规则生成"} ·{" "}
          {brief.promptVersion}
        </p>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-0">
        <BriefSection title="Summary" titleZh="本周概览">
          {brief.summary}
        </BriefSection>

        <SectionDivider />

        <BriefSection title="Campus Insight" titleZh="校园洞察">
          {brief.campusInsight}
        </BriefSection>

        <SectionDivider />

        <BriefSection title="Business Insight" titleZh="经营洞察">
          {brief.businessInsight}
        </BriefSection>

        <SectionDivider />

        <BriefSection title="AI Learned" titleZh="CampusFin 学到">
          {brief.aiLearned}
        </BriefSection>

        <SectionDivider />

        <section className="rounded-lg border border-blue-200/60 bg-blue-50/50 px-3 py-2.5">
          <h3 className={`${dashboardCardTitleClass} text-blue-900`}>
            Focus Next Week
            <span className="ml-1.5 font-normal text-blue-700/60">
              下周重点
            </span>
          </h3>
          <p className={`mt-1.5 ${dashboardBodyClass} font-medium text-blue-950/90`}>
            {brief.focusNextWeek}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
