import type { ReactNode } from "react";
import type { RecommendationAnalysis } from "@/lib/ai/analysis";

interface AiAnalysisPanelProps {
  analysis: RecommendationAnalysis;
}

function TimelineStep({
  icon,
  title,
  titleZh,
  children,
  isLast = false,
}: {
  icon: string;
  title: string;
  titleZh: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          className="absolute left-[11px] top-6 bottom-0 w-px bg-border/60"
          aria-hidden
        />
      )}
      <span
        className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-[11px] text-gray-500"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <h4 className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">
          {title}
          <span className="ml-1.5 normal-case tracking-normal text-gray-400">
            {titleZh}
          </span>
        </h4>
        {children}
      </div>
    </li>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/30 py-1.5 last:border-0">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className="text-[13px] font-medium tabular-nums">{value}</span>
    </div>
  );
}

function InnerCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2.5">
      {children}
    </div>
  );
}

export function AiAnalysisPanel({ analysis }: AiAnalysisPanelProps) {
  return (
    <details className="group rounded-lg border border-border/50 bg-muted/10">
      <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium text-gray-600 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          <span>
            AI Analysis
            <span className="ml-1.5 font-normal text-gray-400">
              AI 决策分析
            </span>
          </span>
          <span className="text-[11px] font-normal text-gray-400 transition group-open:rotate-180">
            ▼
          </span>
        </span>
      </summary>

      <div className="border-t border-border/40 px-3 pb-3 pt-2">
        <ol className="list-none">
          <TimelineStep icon="1" title="Campus Signals" titleZh="校园信号">
            <InnerCard>
              <ul className="space-y-1">
                {analysis.campusSignals.map((signal) => (
                  <li
                    key={signal}
                    className="flex gap-2 text-[13px] leading-snug text-gray-700"
                  >
                    <span className="shrink-0 text-gray-400">✓</span>
                    {signal}
                  </li>
                ))}
              </ul>
            </InnerCard>
          </TimelineStep>

          <TimelineStep icon="2" title="Business Signals" titleZh="经营信号">
            <InnerCard>
              <FactRow
                label="Today's Revenue / 今日营业额"
                value={analysis.businessFacts.revenue}
              />
              <FactRow
                label="Today's Customers / 今日客流"
                value={analysis.businessFacts.customers}
              />
              <FactRow
                label="Business Status / 经营状态"
                value={analysis.businessFacts.status}
              />
              <FactRow
                label="Recent Trend / 近期趋势"
                value={analysis.businessFacts.trend}
              />
            </InnerCard>
          </TimelineStep>

          <TimelineStep icon="3" title="Business Goal" titleZh="经营目标">
            <InnerCard>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Current Goal / 当前目标
              </p>
              <p className="mt-1 text-[14px] font-medium">
                {analysis.goalLabel}
              </p>
              <p className="mt-2 text-[13px] leading-snug text-gray-500">
                {analysis.goalNote}
              </p>
            </InnerCard>
          </TimelineStep>

          <TimelineStep icon="4" title="Learning" titleZh="学习记忆">
            <InnerCard>
              {analysis.learningLines.map((line) => (
                <p
                  key={line}
                  className="text-[13px] leading-snug text-gray-600 last:mb-0"
                >
                  {line}
                </p>
              ))}
            </InnerCard>
          </TimelineStep>

          <TimelineStep icon="5" title="Decision" titleZh="最终决策" isLast>
            <InnerCard>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Decision / 决策
              </p>
              <p className="mt-1 text-[14px] font-medium">
                {analysis.decisionTitle}
              </p>
              <p className="mt-2 text-[13px] leading-snug text-gray-500">
                {analysis.decisionNote}
              </p>
            </InnerCard>
          </TimelineStep>
        </ol>

        <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
          <div className="rounded-md border border-border/40 bg-muted/15 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Alternative Considered / 备选方案
            </p>
            <p className="mt-1 text-[13px] font-medium text-gray-700">
              {analysis.alternative.label}
            </p>
            <p className="mt-1.5 text-[13px] text-gray-500">
              <span className="text-gray-400">Not selected because / 未选原因：</span>
              {analysis.alternative.notSelectedReason}
            </p>
          </div>

          <div className="rounded-md border border-border/40 bg-muted/15 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Confidence / 置信度
            </p>
            <p className="mt-1 text-[13px] font-medium text-gray-700">
              {analysis.confidence.levelLabel}
            </p>
            <p className="mt-1.5 text-[13px] text-gray-500">
              <span className="text-gray-400">Because / 原因：</span>
              {analysis.confidence.because}
            </p>
          </div>

          <div className="rounded-md border border-dashed border-border/50 bg-muted/10 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Why CampusFin Chose This / 为何选择此动作
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-gray-600">
              {analysis.whyChose}
            </p>
          </div>
        </div>
      </div>
    </details>
  );
}
