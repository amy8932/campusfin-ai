import type { CampusContext } from "@/lib/campus/context";
import { TRAFFIC_LABELS } from "@/lib/campus/context";
import type { CampusEventType } from "@/types/database";

export interface CampusSignal {
  emoji: string;
  title: string;
  description: string;
}

const EVENT_EMOJI: Partial<Record<CampusEventType, string>> = {
  academic: "📚",
  career: "🎓",
  sports: "🏃",
  cultural: "🎭",
  holiday: "🎉",
  weather: "🌧",
  season: "📅",
};

function daysUntil(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function momentDescription(moment: string, headlineZh: string): string {
  if (headlineZh && headlineZh.includes("，")) {
    const part = headlineZh.split("，")[1]?.replace(/[。.!]$/, "");
    if (part) return part;
  }
  if (moment.includes("考试")) return "预计晚间客流增加";
  if (moment.includes("论文")) return "打印需求集中";
  if (moment.includes("毕业")) return "毕业季客流波动";
  if (moment.includes("开学")) return "开学客流回升";
  return "校园节奏影响今日经营";
}

function upcomingDescription(eventTitle: string, headlineZh: string): string {
  if (headlineZh.includes(eventTitle)) {
    const snippet = headlineZh.replace(/[。.!]$/, "");
    if (snippet.length <= 24) return snippet;
  }
  if (eventTitle.includes("招聘")) return "预计新增校园人流";
  if (eventTitle.includes("运动") || eventTitle.includes("体育")) {
    return "活动期间客流可能上升";
  }
  return "关注校园活动带来的客流变化";
}

export function buildCampusSignals(
  context: CampusContext,
  todayStr: string
): CampusSignal[] {
  const signals: CampusSignal[] = [];
  const seen = new Set<string>();

  if (context.campusMoment) {
    signals.push({
      emoji: "📚",
      title: context.campusMoment,
      description: momentDescription(context.campusMoment, context.headlineZh),
    });
    seen.add(context.campusMoment);
  }

  for (const event of context.eventsToday) {
    if (event.event_type === "season") continue;
    const emoji = EVENT_EMOJI[event.event_type] ?? "📌";
    const title =
      event.event_type === "weather" ? "雨天" : event.title;
    const description =
      event.event_type === "weather"
        ? "到店人数略下降"
        : context.headlineZh.replace(/[。.!]$/, "").slice(0, 28);
    if (!seen.has(title)) {
      signals.push({ emoji, title, description });
      seen.add(title);
    }
  }

  for (const event of context.eventsUpcoming.slice(0, 2)) {
    const days = daysUntil(todayStr, event.starts_on);
    const emoji = EVENT_EMOJI[event.event_type] ?? "📌";
    const title = `${event.title}（${days}天后）`;
    if (!seen.has(event.title)) {
      signals.push({
        emoji,
        title,
        description: upcomingDescription(event.title, context.headlineZh),
      });
      seen.add(event.title);
    }
  }

  return signals;
}

export function buildTrafficSignal(context: CampusContext): {
  label: string;
  description: string;
} {
  const traffic = TRAFFIC_LABELS[context.trafficForecast];
  return {
    label: `Traffic ${traffic.en}`,
    description: traffic.zh,
  };
}
