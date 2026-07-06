import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CampusContext } from "@/lib/campus/context";
import { TRAFFIC_LABELS } from "@/lib/campus/context";
import type { CampusEvent } from "@/types/database";

interface CampusZoneProps {
  context: CampusContext;
  campusName: string;
}

export function CampusZone({ context, campusName }: CampusZoneProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Today&apos;s Campus / 今日校园</CardDescription>
        <CardTitle className="text-xl font-semibold leading-snug">
          {context.headlineZh}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{context.headline}</p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {context.campusMoment && (
          <EventChip label={context.campusMoment} />
        )}
        {context.eventsToday
          .filter((e) => e.event_type !== "season")
          .map((e) => (
            <EventChip key={e.id} label={e.title} event={e} />
          ))}
        {context.eventsUpcoming.slice(0, 2).map((e) => (
          <EventChip key={`up-${e.id}`} label={`${e.title} · upcoming`} event={e} />
        ))}
        <EventChip
          label={`Traffic ${TRAFFIC_LABELS[context.trafficForecast].zh}`}
        />
        <span className="w-full text-xs text-muted-foreground">{campusName}</span>
      </CardContent>
    </Card>
  );
}

function EventChip({
  label,
  event,
}: {
  label: string;
  event?: CampusEvent;
}) {
  return (
    <span className="inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium">
      {label}
      {event?.traffic_impact === "high" && (
        <span className="ml-1 text-muted-foreground">↑</span>
      )}
    </span>
  );
}
