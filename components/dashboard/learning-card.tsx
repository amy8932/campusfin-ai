import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LearningCardData } from "@/lib/ai/learning";

interface LearningCardProps {
  data: LearningCardData | null;
  visible: boolean;
}

function FeedbackSection({ feedback }: { feedback: LearningCardData["feedback"] }) {
  if (feedback.kind === "none") {
    return (
      <p className="text-sm text-muted-foreground">暂无反馈 / No feedback yet</p>
    );
  }

  if (feedback.kind === "not_executed") {
    return (
      <p className="text-sm font-medium">
        <span className="text-destructive">✗</span> 未执行 / Not executed
      </p>
    );
  }

  const helpfulnessLine =
    feedback.helpfulness === "good"
      ? "👍 有帮助 / Helpful"
      : feedback.helpfulness === "neutral"
        ? "😐 一般 / Neutral"
        : feedback.helpfulness === "bad"
          ? "👎 没帮助 / Not helpful"
          : null;

  return (
    <div className="space-y-1 text-sm font-medium">
      <p>
        <span className="text-primary">✓</span> 已执行 / Executed
      </p>
      {helpfulnessLine && <p>{helpfulnessLine}</p>}
    </div>
  );
}

export function LearningCard({ data, visible }: LearningCardProps) {
  if (!visible || !data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>AI Learning / AI 学习</CardDescription>
        <CardTitle className="text-lg">Learning timeline / 学习轨迹</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold">Yesterday / 昨天</h3>
          <p className="text-xs text-muted-foreground">昨天建议</p>
          <p className="text-sm leading-snug">
            {data.yesterday.title ?? "暂无历史建议"}
          </p>
        </section>

        <div className="border-t" />

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold">Owner Feedback / 老板反馈</h3>
          <FeedbackSection feedback={data.feedback} />
        </section>

        <div className="border-t" />

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold">AI Learned / AI 已学习</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.learnedText}
          </p>
        </section>

        {data.timeline.length > 0 && (
          <>
            <div className="border-t" />
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">
                Recent Learning / 近期学习
              </h3>
              <ul className="space-y-1.5">
                {data.timeline.map((item) => (
                  <li
                    key={item.date}
                    className="flex items-baseline gap-3 text-sm tabular-nums"
                  >
                    <span className="w-9 shrink-0 font-medium text-muted-foreground">
                      {item.weekdayLabel}
                    </span>
                    <span>{item.shortLabel}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <div className="border-t" />

        <section>
          <p className="text-sm font-medium">
            AI 已学习 {data.stats.historyCount} 条经营记录
          </p>
          <p className="text-xs text-muted-foreground">
            {data.stats.historyCount} recommendation
            {data.stats.historyCount === 1 ? "" : "s"} in history
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
