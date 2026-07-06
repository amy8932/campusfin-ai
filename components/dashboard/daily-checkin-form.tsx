"use client";

import { useActionState } from "react";
import { submitDailyCheckin, type CheckinFormState } from "@/lib/actions/checkin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CheckinFormState = {};

interface DailyCheckinFormProps {
  checkinDate: string;
  defaultRevenue?: number;
  defaultCustomerCount?: number;
  defaultNote?: string;
}

export function DailyCheckinForm({
  checkinDate,
  defaultRevenue,
  defaultCustomerCount,
  defaultNote,
}: DailyCheckinFormProps) {
  const [state, formAction, pending] = useActionState(
    submitDailyCheckin,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="checkin_date" value={checkinDate} />

      <div className="space-y-2">
        <Label htmlFor="revenue">Revenue / 营业额 *</Label>
        <Input
          id="revenue"
          name="revenue"
          type="number"
          min={0}
          step="0.01"
          required
          placeholder="0.00"
          defaultValue={defaultRevenue ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer_count">Customer count / 客流 *</Label>
        <Input
          id="customer_count"
          name="customer_count"
          type="number"
          min={0}
          step={1}
          required
          placeholder="0"
          defaultValue={defaultCustomerCount ?? ""}
        />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">
          Add a note / 添加备注（可选）
        </summary>
        <div className="mt-2 space-y-2">
          <Input
            id="note"
            name="note"
            maxLength={140}
            placeholder="Optional context for today"
            defaultValue={defaultNote ?? ""}
          />
        </div>
      </details>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save & return / 保存并返回"}
      </Button>
    </form>
  );
}
