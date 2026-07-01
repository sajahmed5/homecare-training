import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tierLabel, type PackageTier } from "@/lib/organisations";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingPanel } from "./billing-panel";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const context = await requireRole("org_admin");
  const { success } = await searchParams;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organisations")
    .select("package_tier, subscription_status, stripe_customer_id, forms_enabled, recruitment_enabled")
    .eq("id", context.organisationId!)
    .maybeSingle();

  const tier = (org?.package_tier ?? "core") as PackageTier;

  return (
    <DashboardShell title="Billing" context={context}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/org" className="text-sm text-muted-foreground hover:underline">
          ← Back to console
        </Link>

        {success && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm">
            Subscription updated — your plan will reflect shortly.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {tierLabel(tier)}
              {org?.subscription_status ? (
                <>
                  {" · "}
                  <Badge variant="secondary">{org.subscription_status}</Badge>
                </>
              ) : (
                " · no active subscription"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span>Forms: {org?.forms_enabled ? "on" : "off"}</span>
              <span>·</span>
              <span>Recruitment: {org?.recruitment_enabled ? "on" : "off"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change plan</CardTitle>
            <CardDescription>
              Subscribing turns the add-ons on automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingPanel
              currentTier={tier}
              hasCustomer={!!org?.stripe_customer_id}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
