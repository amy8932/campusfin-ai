"use client";

import { acknowledgeRecommendation } from "@/lib/actions/checkin";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

interface AcknowledgeButtonProps {
  recommendationId: string;
  acknowledged: boolean;
}

export function AcknowledgeButton({
  recommendationId,
  acknowledged,
}: AcknowledgeButtonProps) {
  const [pending, startTransition] = useTransition();

  if (acknowledged) {
    return (
      <p className="text-sm text-muted-foreground">
        Today&apos;s priority acknowledged ✓ / 今日重点已确认
      </p>
    );
  }

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => acknowledgeRecommendation(recommendationId))
      }
    >
      {pending ? "…" : "Got it / 知道了"}
    </Button>
  );
}
