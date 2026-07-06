import { redirect } from "next/navigation";
import { getOwnerBusiness } from "@/lib/business";
import { BusinessSetupCard } from "@/components/dashboard/business-setup-form";

export default async function BusinessSetupPage() {
  const business = await getOwnerBusiness();
  if (business) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">
          Tell us about your shop to unlock campus-aware insights.
        </p>
      </div>
      <BusinessSetupCard />
    </div>
  );
}
