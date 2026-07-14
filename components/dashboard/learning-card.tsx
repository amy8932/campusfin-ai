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
  dashboardDividerClass,
  dashboardSectionClass,
} from "@/components/dashboard/dashboard-styles";
import type { LearningCardData } from "@/lib/ai/learning";

interface LearningCardProps {
  data: LearningCardData | null;
  visible: boolean;
}

function FeedbackSection({ feedback }: { feedback: LearningCardData["feedback"] }) {
  if (feedback.kind === "none") {
    return (
      <p className={`${dashboardBodyClass} text-gray-500`}>
        告诉 CampusFin 是否有帮助，以后推荐会越来越懂你。
      </p>
    );
  }

  if (feedback.kind === "not_executed") {
    return (
      <p className={`${dashboardBodyClass} font-medium`}>
        <span className="text-destructive">✗</span> 未执行
        <span className="ml-1.5 font-normal text-gray-500">Not executed</span>
      </p>
    );
  }

  const helpfulnessLine =
    feedback.helpfulness === "good"
      ? "👍 很有帮助"
      : feedback.helpfulness === "neutral"
        ? "😐 一般"
        : feedback.helpfulness === "bad"
          ? "👎 没帮助"
          : null;

  return (
    <div className={`space-y-0.5 ${dashboardBodyClass} font-medium`}>
      <p>
        <span className="text-primary">✓</span> 已执行
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
    <Card className={dashboardCardClass}>
      <CardHeader className="pb-2">
        <CardDescription className={dashboardCaptionClass}>
          CampusFin Learning
        </CardDescription>
        <h2 className={dashboardSectionClass}>CampusFin 学习</h2>
        <p className={dashboardCaptionClass}>
          CampusFin 正在学习你的经营方式
        </p>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-0">
        <section className="space-y-1">
          <h3 className={dashboardCardTitleClass}>
            Latest Recommendation
            <span className="ml-1.5 font-normal text-gray-500">
              最近一次建议
            </span>
          </h3>
          <p className={dashboardBodyClass}>
            {data.latest.title ?? "暂无近期建议"}
          </p>
        </section>

        <div className={dashboardDividerClass} />

        <section className="space-y-1">
          <h3 className={dashboardCardTitleClass}>
            Owner Response
            <span className="ml-1.5 font-normal text-gray-500">你的反馈</span>
          </h3>
          <FeedbackSection feedback={data.feedback} />
        </section>

        <div className={dashboardDividerClass} />

        <section className="space-y-1">
          <h3 className={dashboardCardTitleClass}>
            CampusFin Learned
            <span className="ml-1.5 font-normal text-gray-500">
              CampusFin 了解到
            </span>
          </h3>
          <p className={`${dashboardBodyClass} text-gray-600`}>
            {data.learnedText}
          </p>
        </section>

        {data.timeline.length > 0 && (
          <>
            <div className={dashboardDividerClass} />
            <section className="space-y-1.5">
              <h3 className={dashboardCardTitleClass}>
                Recent Decisions
                <span className="ml-1.5 font-normal text-gray-500">
                  近期建议
                </span>
              </h3>
              <ul className="space-y-1">
                {data.timeline.map((item) => (
                  <li
                    key={item.date}
                    className={`flex items-baseline gap-3 ${dashboardBodyClass}`}
                  >
                    <span className="w-16 shrink-0 text-gray-500">
                      {item.dateLabel}
                    </span>
                    <span>{item.actionLabel}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <div className={dashboardDividerClass} />

        <section className="space-y-1">
          <h3 className={dashboardCardTitleClass}>
            Learning Progress
            <span className="ml-1.5 font-normal text-gray-500">学习进度</span>
          </h3>
          <p className={dashboardBodyClass}>
            CampusFin has learned from{" "}
            <span className="text-xl font-semibold tabular-nums text-foreground">
              {data.stats.historyCount}
            </span>{" "}
            business decisions
          </p>
          <p className={dashboardCaptionClass}>
            已学习{" "}
            <span className="font-semibold text-foreground">
              {data.stats.historyCount}
            </span>{" "}
            次经营决策 · CampusFin 会持续学习你的经营方式。
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
