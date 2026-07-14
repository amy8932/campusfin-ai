import { FounderDashboard } from "@/components/founder/founder-dashboard";
import { loadFounderAnalytics } from "@/lib/founder/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Founder Analytics · CampusFin AI",
  description: "Internal product analytics for the CampusFin team",
};

export default async function FounderPage() {
  const admin = createAdminClient();
  const client = admin ?? (await createClient());
  const data = await loadFounderAnalytics(client);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Founder Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Evaluate whether the AI product is creating value across recommendations,
          feedback, and campus signals.
        </p>
      </div>
      <FounderDashboard data={data} />
    </div>
  );
}
