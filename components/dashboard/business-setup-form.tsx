"use client";

import { useActionState } from "react";
import { createBusiness } from "@/lib/actions/checkin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BUSINESS_GOAL_LABELS } from "@/lib/health";
import type { BusinessGoal, BusinessType } from "@/types/database";

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "coffee_shop", label: "Coffee shop / 咖啡店" },
  { value: "bubble_tea", label: "Bubble tea / 奶茶店" },
  { value: "restaurant", label: "Restaurant / 餐厅" },
  { value: "print_shop", label: "Print shop / 打印店" },
  { value: "nail_salon", label: "Nail salon / 美甲店" },
  { value: "hair_salon", label: "Hair salon / 美发店" },
  { value: "other", label: "Other / 其他" },
];

const GOALS = Object.entries(BUSINESS_GOAL_LABELS) as [BusinessGoal, string][];

export function BusinessSetupForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      const result = await createBusiness(formData);
      return result ?? {};
    },
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Business name / 店铺名称 *</Label>
        <Input id="name" name="name" required placeholder="Sunrise Coffee" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campus_name">Campus / 校园名称 *</Label>
        <Input
          id="campus_name"
          name="campus_name"
          required
          placeholder="北京某高校"
          defaultValue="北京某高校"
        />
        <p className="text-xs text-muted-foreground">
          Use 北京某高校 to see seeded campus events in MVP.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_type">Business type / 业态</Label>
        <select
          id="business_type"
          name="business_type"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          defaultValue="coffee_shop"
        >
          {BUSINESS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Business goal / 经营目标 *</Label>
        <div className="space-y-2">
          {GOALS.map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-checked:border-primary"
            >
              <input
                type="radio"
                name="business_goal"
                value={value}
                defaultChecked={value === "increase_revenue"}
                className="size-4"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Go to dashboard / 进入仪表盘"}
      </Button>
    </form>
  );
}

export function BusinessSetupCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up your business</CardTitle>
        <CardDescription>创建店铺信息 · Step 1 of 1</CardDescription>
      </CardHeader>
      <CardContent>
        <BusinessSetupForm />
      </CardContent>
    </Card>
  );
}
