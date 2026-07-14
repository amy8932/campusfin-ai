import type { ReactNode } from "react";

export function FounderSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function FounderCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border/80 bg-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <FounderCard>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </FounderCard>
  );
}

export function HorizontalBarChart({
  items,
}: {
  items: Array<{ label: string; pct: number; count?: number }>;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No data yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-foreground">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.pct}%
              {item.count != null ? (
                <span className="ml-1 text-xs">({item.count})</span>
              ) : null}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/75 transition-all"
              style={{ width: `${Math.max(item.pct, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedbackStackChart({
  helpful,
  neutral,
  notHelpful,
  notExecuted,
}: {
  helpful: number;
  neutral: number;
  notHelpful: number;
  notExecuted: number;
}) {
  const total = helpful + neutral + notHelpful + notExecuted;
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">No feedback yet.</p>
    );
  }

  const segments = [
    { key: "helpful", label: "👍 Helpful", count: helpful, className: "bg-emerald-500/80" },
    { key: "neutral", label: "😐 Neutral", count: neutral, className: "bg-zinc-400/80" },
    { key: "bad", label: "👎 Not Helpful", count: notHelpful, className: "bg-rose-400/80" },
    { key: "skip", label: "Not Executed", count: notExecuted, className: "bg-zinc-200 dark:bg-zinc-700" },
  ].filter((s) => s.count > 0);

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full">
        {segments.map((s) => (
          <div
            key={s.key}
            className={s.className}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${s.className}`} />
              {s.label}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {s.count} ({Math.round((s.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TimelineChart({
  points,
}: {
  points: Array<{ weekday: string; count: number }>;
}) {
  const max = Math.max(...points.map((p) => p.count), 1);

  return (
    <div className="flex h-36 items-end gap-2">
      {points.map((p) => {
        const heightPct = (p.count / max) * 100;
        return (
          <div
            key={p.weekday}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <span className="text-xs tabular-nums text-muted-foreground">
              {p.count}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-sm bg-foreground/15"
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {p.weekday}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function InsightRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">
        {value ?? "—"}
      </span>
    </div>
  );
}

export function OutcomeRow({
  label,
  action,
  metric,
}: {
  label: string;
  action: string | null;
  metric: string;
}) {
  return (
    <div className="space-y-1 border-b border-border/60 py-3 last:border-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{action ?? "—"}</p>
      <p className="text-xs tabular-nums text-muted-foreground">{metric}</p>
    </div>
  );
}
