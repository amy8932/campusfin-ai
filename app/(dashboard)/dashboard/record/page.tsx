import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnerBusiness } from "@/lib/business";
import { getBusinessDateString } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";
import { DailyCheckinForm } from "@/components/dashboard/daily-checkin-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyCheckin } from "@/types/database";

export default async function DailyCheckinPage() {
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/setup");
  }

  const todayStr = getBusinessDateString(business.business_timezone);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("business_id", business.id)
    .eq("checkin_date", todayStr)
    .maybeSingle();

  const checkin = existing as DailyCheckin | null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to Today
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Daily Check-in
        </h1>
        <p className="text-lg text-muted-foreground">今日经营打卡</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Record today&apos;s business numbers in under 2 minutes.
          <br />
          用 2 分钟记录今天的经营情况。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {todayStr}
            {checkin ? " · editing" : ""}
          </CardTitle>
          <CardDescription>
            {business.name} · {business.campus_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyCheckinForm
            checkinDate={todayStr}
            defaultRevenue={checkin ? Number(checkin.revenue) : undefined}
            defaultCustomerCount={checkin?.customer_count}
            defaultNote={checkin?.note ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
