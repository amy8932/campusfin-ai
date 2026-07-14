import Link from "next/link";
import type { FounderAnalytics } from "@/lib/founder/analytics";
import {
  FeedbackStackChart,
  FounderCard,
  FounderSection,
  HorizontalBarChart,
  InsightRow,
  MetricTile,
  OutcomeRow,
  TimelineChart,
} from "@/components/founder/founder-charts";

function confidenceLabel(score: number): string {
  if (score >= 2.5) return "High";
  if (score >= 1.5) return "Medium";
  return "Low";
}

function formatLlmSeconds(ms: number | null): string {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)} s`;
}

export function FounderDashboard({ data }: { data: FounderAnalytics }) {
  const { overview } = data;

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricTile
          label="Recommendations"
          value={String(overview.totalRecommendations)}
        />
        <MetricTile
          label="Acceptance"
          value={
            overview.acceptanceRate != null
              ? `${overview.acceptanceRate}%`
              : "—"
          }
          hint="Executed / feedback given"
        />
        <MetricTile
          label="Avg Confidence"
          value={confidenceLabel(overview.averageConfidence)}
          hint={`Score ${overview.averageConfidence}`}
        />
        <MetricTile
          label="Fallback"
          value={`${overview.fallbackRate}%`}
          hint="Rule-based recommendations"
        />
        <MetricTile
          label="Avg LLM"
          value={formatLlmSeconds(overview.averageLlmMs)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FounderSection title="Action Type Distribution">
          <FounderCard>
            <HorizontalBarChart
              items={data.actionDistribution.map((d) => ({
                label: d.label,
                pct: d.pct,
                count: d.count,
              }))}
            />
          </FounderCard>
        </FounderSection>

        <FounderSection title="Feedback Distribution">
          <FounderCard>
            <FeedbackStackChart
              helpful={data.feedbackDistribution.helpful}
              neutral={data.feedbackDistribution.neutral}
              notHelpful={data.feedbackDistribution.notHelpful}
              notExecuted={data.feedbackDistribution.notExecuted}
            />
          </FounderCard>
        </FounderSection>
      </div>

      <FounderSection title="Learning Progress">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricTile
            label="Businesses"
            value={String(data.learning.totalBusinesses)}
          />
          <MetricTile
            label="With Feedback"
            value={String(data.learning.businessesWithFeedback)}
          />
          <MetricTile
            label="Recs / Business"
            value={String(data.learning.avgRecommendationsPerBusiness)}
          />
          <MetricTile
            label="Avg Repeat"
            value={String(data.learning.avgRepeatCount)}
            hint="Max consecutive same action"
          />
          <MetricTile
            label="Learning Coverage"
            value={`${data.learning.learningCoveragePct}%`}
          />
        </div>
      </FounderSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <FounderSection title="Campus Insights">
          <FounderCard>
            <InsightRow
              label="Most Influential Campus Moment"
              value={data.campusInsights.mostInfluentialMoment}
            />
            <InsightRow
              label="Highest Revenue Campus Event"
              value={data.campusInsights.highestRevenueEvent}
            />
            <InsightRow
              label="Most Frequent Event"
              value={data.campusInsights.mostFrequentEvent}
            />
          </FounderCard>
        </FounderSection>

        <FounderSection title="AI Performance">
          <FounderCard className="space-y-3">
            <InsightRow
              label="LLM Success Rate"
              value={
                data.aiPerformance.llmSuccessRate != null
                  ? `${data.aiPerformance.llmSuccessRate}%`
                  : "—"
              }
            />
            <InsightRow
              label="Validator Pass Rate"
              value={
                data.aiPerformance.validatorPassRate != null
                  ? `${data.aiPerformance.validatorPassRate}%`
                  : "—"
              }
            />
            <InsightRow
              label="Fallback Count"
              value={String(data.aiPerformance.fallbackCount)}
            />
            <InsightRow
              label="Average Retry Count"
              value={String(data.aiPerformance.avgRetryCount)}
            />
            {data.aiPerformance.promptVersions.length > 0 ? (
              <div className="border-t border-border/60 pt-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Prompt Version
                </p>
                <HorizontalBarChart
                  items={data.aiPerformance.promptVersions.map((v) => ({
                    label: v.version,
                    pct: v.pct,
                    count: v.count,
                  }))}
                />
              </div>
            ) : null}
          </FounderCard>
        </FounderSection>
      </div>

      <FounderSection title="Business Outcomes">
        <FounderCard>
          <div className="grid gap-0 sm:grid-cols-2">
            <OutcomeRow
              label="Most Accepted"
              action={data.businessOutcomes.mostAccepted?.label ?? null}
              metric={
                data.businessOutcomes.mostAccepted
                  ? `Acceptance ${data.businessOutcomes.mostAccepted.rate}%`
                  : "Need ≥2 feedback per action"
              }
            />
            <OutcomeRow
              label="Least Accepted"
              action={data.businessOutcomes.leastAccepted?.label ?? null}
              metric={
                data.businessOutcomes.leastAccepted
                  ? `Acceptance ${data.businessOutcomes.leastAccepted.rate}%`
                  : "—"
              }
            />
            <OutcomeRow
              label="Most Ignored"
              action={data.businessOutcomes.mostIgnored?.label ?? null}
              metric={
                data.businessOutcomes.mostIgnored
                  ? `${data.businessOutcomes.mostIgnored.count} not executed`
                  : "—"
              }
            />
            <OutcomeRow
              label="Highest Confidence"
              action={data.businessOutcomes.highestConfidence?.label ?? null}
              metric={
                data.businessOutcomes.highestConfidence
                  ? `Score ${data.businessOutcomes.highestConfidence.score}`
                  : "—"
              }
            />
          </div>
        </FounderCard>
      </FounderSection>

      <FounderSection
        title="Activity Timeline"
        subtitle="Recommendations by weekday (all time)"
      >
        <FounderCard>
          <TimelineChart points={data.timeline} />
        </FounderCard>
      </FounderSection>

      <p className="text-xs text-muted-foreground">
        {data.scopeNote}. Read-only analytics — no production AI changes.{" "}
        <Link href="/dashboard" className="underline underline-offset-2">
          Back to merchant dashboard
        </Link>
      </p>
    </div>
  );
}
