import { afterAll, describe, it, expect } from "vitest";
import { adminClient, cleanup, createOrg } from "./helpers";
import { applySubscriptionToOrg } from "../lib/billing";

const orgIds: string[] = [];
const RUN = `${Date.now()}`;

afterAll(async () => {
  await cleanup([], orgIds);
});

describe("applySubscriptionToOrg (what the webhook does)", () => {
  it("a Full subscription enables both add-ons", async () => {
    const admin = adminClient();
    const org = await createOrg(`Bill Full ${RUN}`);
    orgIds.push(org);

    await applySubscriptionToOrg(admin, {
      organisationId: org,
      tier: "full",
      customerId: "cus_test",
      subscriptionId: "sub_test",
      status: "active",
    });

    const { data } = await admin
      .from("organisations")
      .select("package_tier, forms_enabled, recruitment_enabled, subscription_status")
      .eq("id", org)
      .single();
    expect(data).toMatchObject({
      package_tier: "full",
      forms_enabled: true,
      recruitment_enabled: true,
      subscription_status: "active",
    });
  });

  it("cancelling downgrades to Core and turns add-ons off", async () => {
    const admin = adminClient();
    const org = await createOrg(`Bill Cancel ${RUN}`);
    orgIds.push(org);

    await applySubscriptionToOrg(admin, { organisationId: org, tier: "full" });
    await applySubscriptionToOrg(admin, {
      organisationId: org,
      tier: "core",
      subscriptionId: null,
      status: "canceled",
    });

    const { data } = await admin
      .from("organisations")
      .select("package_tier, forms_enabled, recruitment_enabled")
      .eq("id", org)
      .single();
    expect(data).toMatchObject({
      package_tier: "core",
      forms_enabled: false,
      recruitment_enabled: false,
    });
  });
});
