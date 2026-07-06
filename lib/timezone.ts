const DEFAULT_TIMEZONE = "Asia/Shanghai";

/** Returns YYYY-MM-DD for a given timezone (business-local date). */
export function getBusinessDateString(
  timezone: string = DEFAULT_TIMEZONE,
  date: Date = new Date()
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatBusinessDateLabel(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: timezone,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(utc);
}

export { DEFAULT_TIMEZONE };
