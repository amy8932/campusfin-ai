import type { ReactNode } from "react";
import Link from "next/link";
import { buildRecommendationAnalysis } from "@/lib/ai/analysis";
import { buildRecommendationPresentation } from "@/lib/ai/presentation";
import { AiAnalysisPanel } from "@/components/dashboard/ai-analysis-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardBadgeClass,
  dashboardBodyClass,
  dashboardCaptionClass,
  dashboardCardClass,
  dashboardCardTitleClass,
  dashboardDividerClass,
  dashboardSectionClass,
} from "@/components/dashboard/dashboard-styles";
import { FeedbackButton } from "@/components/dashboard/feedback-button";
import type { AIRecommendation } from "@/types/database";

interface PriorityZoneProps {
  todayCheckin: boolean;
  recommendation: AIRecommendation | null;
  feedbackSubmitted: boolean;
}

function StatusBadge({ children }: { children: ReactNode }) {
  return <span className={dashboardBadgeClass}>{children}</span>;
}

export function PriorityZone({
  todayCheckin,
  recommendation,
  feedbackSubmitted,
}: PriorityZoneProps) {
  const presentation =
    recommendation != null
      ? buildRecommendationPresentation(recommendation)
      : null;
  const analysis =
    recommendation != null
      ? buildRecommendationAnalysis(recommendation)
      : null;

  return (
    <Card className={dashboardCardClass}>
      <CardHeader className="pb-2">
        <CardDescription className={dashboardCaptionClass}>
          Today&apos;s Priority / 今日重点
        </CardDescription>
        {!todayCheckin ? (
          <>
            <CardTitle className={dashboardSectionClass}>
              Record today&apos;s numbers
            </CardTitle>
            <p className={`${dashboardBodyClass} text-gray-500`}>
              完成今日经营打卡，获取校园场景经营建议。
            </p>
          </>
        ) : recommendation ? (
          <CardTitle className={`${dashboardSectionClass} text-[17px]`}>
            {recommendation.recommendation_title}
          </CardTitle>
        ) : (
          <>
            <CardTitle className={dashboardSectionClass}>
              Preparing your tip…
            </CardTitle>
            <p className={`${dashboardBodyClass} text-gray-500`}>
              若持续出现，请重新完成打卡。
            </p>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-3.5 pt-0">
        {!todayCheckin ? (
          <Button render={<Link href="/dashboard/record" />}>
            Daily Check-in / 今日经营打卡
          </Button>
        ) : recommendation && presentation ? (
          <>
            {recommendation.expected_impact && (
              <p className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 text-[15px] font-medium leading-snug">
                {recommendation.expected_impact}
              </p>
            )}

            {presentation.signalsToday.length > 0 && (
              <section className="space-y-1.5">
                <h3 className={dashboardCardTitleClass}>
                  Today&apos;s Signals
                  <span className="ml-1.5 font-normal text-gray-500">
                    今天发生了什么？
                  </span>
                </h3>
                <ul className={`space-y-1 ${dashboardBodyClass}`}>
                  {presentation.signalsToday.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="shrink-0 text-primary">✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-1">
              <h3 className={dashboardCardTitleClass}>
                Why this action?
                <span className="ml-1.5 font-normal text-gray-500">
                  为什么推荐这个动作？
                </span>
              </h3>
              <p className={dashboardBodyClass}>{presentation.whyThisAction}</p>
            </section>

            <div className={`${dashboardDividerClass} pt-3`}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge>{presentation.difficultyBadge}</StatusBadge>
                <StatusBadge>{presentation.estimatedTime}</StatusBadge>
                <StatusBadge>{presentation.confidenceBadge}</StatusBadge>
              </div>
            </div>

            <FeedbackButton
              recommendationId={recommendation.id}
              feedbackSubmitted={feedbackSubmitted}
            />

            {analysis && <AiAnalysisPanel analysis={analysis} />}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
