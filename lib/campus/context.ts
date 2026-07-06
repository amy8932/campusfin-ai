import type { CampusEvent, TrafficImpact } from "@/types/database";

export interface CampusContext {
  headline: string;
  headlineZh: string;
  eventsToday: CampusEvent[];
  eventsUpcoming: CampusEvent[];
  trafficForecast: TrafficImpact;
  campusMoment: string | null;
}

function isEventActiveOn(event: CampusEvent, dateStr: string): boolean {
  const end = event.ends_on ?? event.starts_on;
  return event.starts_on <= dateStr && end >= dateStr;
}

function isEventUpcoming(event: CampusEvent, dateStr: string, withinDays: number): boolean {
  const start = new Date(event.starts_on + "T12:00:00");
  const today = new Date(dateStr + "T12:00:00");
  const diff = (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= withinDays;
}

function maxTraffic(events: CampusEvent[]): TrafficImpact {
  if (events.some((e) => e.traffic_impact === "high")) return "high";
  if (events.some((e) => e.traffic_impact === "low")) return "low";
  return "normal";
}

export function buildCampusContext(
  events: CampusEvent[],
  campusName: string,
  todayStr: string
): CampusContext {
  const eventsToday = events.filter((e) => isEventActiveOn(e, todayStr));
  const eventsUpcoming = events.filter((e) =>
    isEventUpcoming(e, todayStr, 7)
  );

  const seasonEvent = eventsToday.find((e) => e.event_type === "season");
  const campusMoment = seasonEvent?.title ?? null;

  const highUpcoming = events.filter(
    (e) =>
      e.traffic_impact === "high" &&
      (isEventActiveOn(e, todayStr) || isEventUpcoming(e, todayStr, 3))
  );

  const trafficForecast = maxTraffic([...eventsToday, ...highUpcoming]);

  let headline: string;
  let headlineZh: string;

  if (highUpcoming.length > 0) {
    const next = highUpcoming[0];
    headline = `${next.title} coming up — expect higher foot traffic near ${campusName}.`;
    headlineZh = `即将举行${next.title}，${campusName}周边客流预计上升。`;
  } else if (seasonEvent) {
    headline = `${seasonEvent.title} is active — plan for campus-driven demand.`;
    headlineZh = `${seasonEvent.title}进行中，请根据校园节奏调整经营。`;
  } else if (eventsToday.length > 0) {
    headline = `${eventsToday[0].title} today at ${campusName}.`;
    headlineZh = `今日${campusName}有${eventsToday[0].title}。`;
  } else {
    headline = `Steady week at ${campusName} — traffic expected: normal.`;
    headlineZh = `${campusName}本周节奏平稳，客流预计正常。`;
  }

  return {
    headline,
    headlineZh,
    eventsToday,
    eventsUpcoming,
    trafficForecast,
    campusMoment,
  };
}

export const TRAFFIC_LABELS: Record<TrafficImpact, { en: string; zh: string }> = {
  high: { en: "High ↑", zh: "偏高 ↑" },
  normal: { en: "Normal →", zh: "正常 →" },
  low: { en: "Low ↓", zh: "偏低 ↓" },
};
