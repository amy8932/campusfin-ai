"use client";

import { useState, useTransition } from "react";
import { submitRecommendationFeedback } from "@/lib/actions/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FeedbackHelpfulness } from "@/types/database";
import { cn } from "@/lib/utils";

interface FeedbackButtonProps {
  recommendationId: string;
  feedbackSubmitted: boolean;
}

export function FeedbackButton({
  recommendationId,
  feedbackSubmitted,
}: FeedbackButtonProps) {
  const [submitted, setSubmitted] = useState(feedbackSubmitted);
  const [showModal, setShowModal] = useState(false);
  const [helpfulness, setHelpfulness] = useState<FeedbackHelpfulness | null>(
    null
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (submitted) {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        ✓ 已记录 / Recorded
      </p>
    );
  }

  function submit(
    executed: boolean,
    rating: FeedbackHelpfulness | null,
    optionalNote: string | null
  ) {
    setError(null);
    startTransition(async () => {
      const result = await submitRecommendationFeedback({
        recommendation_id: recommendationId,
        executed,
        helpfulness: rating,
        optional_note: optionalNote,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      setShowModal(false);
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => setShowModal(true)}>
          ✓ 已执行
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => submit(false, null, null)}
        >
          以后再说
        </Button>
      </div>
      {error && !showModal && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
        >
          <div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-lg">
            <h3 id="feedback-modal-title" className="text-base font-semibold">
              这个建议有没有帮助？
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Was this suggestion helpful?
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(
                [
                  { value: "good" as const, label: "👍 有帮助" },
                  { value: "neutral" as const, label: "😐 一般" },
                  { value: "bad" as const, label: "👎 没帮助" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={pending}
                  onClick={() => setHelpfulness(option.value)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                    helpfulness === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="feedback-note" className="text-xs text-muted-foreground">
                留言（选填）
              </Label>
              <Input
                id="feedback-note"
                value={note}
                maxLength={140}
                placeholder="Optional note"
                disabled={pending}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                className="flex-1"
                disabled={pending || !helpfulness}
                onClick={() => submit(true, helpfulness, note.trim() || null)}
              >
                {pending ? "…" : "提交"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setShowModal(false);
                  setHelpfulness(null);
                  setNote("");
                  setError(null);
                }}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
