import Link from "next/link";
import { buildRecommendationPresentation } from "@/lib/ai/presentation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedbackButton } from "@/components/dashboard/feedback-button";
import type { AIRecommendation } from "@/types/database";

interface PriorityZoneProps {
  todayCheckin: boolean;
  recommendation: AIRecommendation | null;
  feedbackSubmitted: boolean;
}

function MetaBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium leading-snug">{value}</p>
    </div>
  );
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

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardDescription>Today&apos;s Priority / 今日重点</CardDescription>
        {!todayCheckin ? (
          <>
            <CardTitle className="text-lg">Record today&apos;s numbers</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete Daily Check-in to unlock your campus-aware recommendation.
              <br />
              完成今日经营打卡，获取校园场景经营建议。
            </p>
          </>
        ) : recommendation ? (
          <CardTitle className="text-lg leading-snug">
            {recommendation.recommendation_title}
          </CardTitle>
        ) : (
          <>
            <CardTitle className="text-lg">Preparing your tip…</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete check-in again if this persists.
            </p>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {!todayCheckin ? (
          <Button render={<Link href="/dashboard/record" />}>
            Daily Check-in / 今日经营打卡
          </Button>
        ) : recommendation && presentation ? (
          <>
            {presentation.whyToday.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Why today? / 为什么今天是这个局面？
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {presentation.whyToday.map((bullet) => (
                    <li key={bullet} className="flex gap-2 leading-snug">
                      <span className="shrink-0 text-primary">✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">
                Why this recommendation? / 为什么是这个建议？
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {presentation.whyThisRecommendation}
              </p>
            </section>

            {recommendation.expected_impact && (
              <section className="space-y-1">
                <h3 className="text-sm font-semibold">
                  Expected impact / 预计影响
                </h3>
                <p className="text-sm">{recommendation.expected_impact}</p>
              </section>
            )}

            <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <MetaBadge
                label="Execution difficulty / 执行难度"
                value={presentation.executionDifficulty}
              />
              <MetaBadge
                label="Estimated time / 预计用时"
                value={presentation.estimatedTime}
              />
              <MetaBadge
                label={`AI confidence / AI 置信度 · ${presentation.confidenceLabel}`}
                value={presentation.confidenceDisplay}
              />
            </section>

            <FeedbackButton
              recommendationId={recommendation.id}
              feedbackSubmitted={feedbackSubmitted}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
