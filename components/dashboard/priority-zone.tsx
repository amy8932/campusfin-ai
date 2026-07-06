import Link from "next/link";
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

export function PriorityZone({
  todayCheckin,
  recommendation,
  feedbackSubmitted,
}: PriorityZoneProps) {
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
            ★ {recommendation.recommendation_title}
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
      <CardContent className="space-y-4">
        {!todayCheckin ? (
          <Button render={<Link href="/dashboard/record" />}>
            Daily Check-in / 今日经营打卡
          </Button>
        ) : recommendation ? (
          <>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Why / 原因</p>
                <p>{recommendation.reason}</p>
              </div>
              {recommendation.expected_impact && (
                <div>
                  <p className="font-medium text-muted-foreground">
                    Expected impact / 预计影响
                  </p>
                  <p>{recommendation.expected_impact}</p>
                </div>
              )}
            </div>
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
