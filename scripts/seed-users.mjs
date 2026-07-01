// Idempotent seed script — creates a demo org + one user per role so you can
// log in and click through each dashboard. Safe to run repeatedly (it updates
// existing users rather than erroring).
//
//   node scripts/seed-users.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Override the shared password with SEED_PASSWORD=... if you like.

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const PASSWORD = process.env.SEED_PASSWORD || "CareAcademy!2026";
const ORG_NAME = "Demo Care Ltd";

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureOrg(name) {
  const { data: existing } = await admin
    .from("organisations")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await admin
    .from("organisations")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function findUserByEmail(email) {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 200) return null;
  }
}

async function ensureUser({ email, role, organisationId, fullName }) {
  const user_metadata = {
    role,
    organisation_id: organisationId ?? null,
    full_name: fullName,
  };
  const existing = await findUserByEmail(email);

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      user_metadata,
    });
    // updates don't re-run the new-user trigger, so sync the profile row.
    const { error } = await admin.from("users").upsert({
      id: existing.id,
      email,
      role,
      organisation_id: organisationId ?? null,
      full_name: fullName,
    });
    if (error) throw error;
    return { email, role, created: false };
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata,
  });
  if (error) throw error;
  return { email, role, created: true };
}

const orgId = await ensureOrg(ORG_NAME);

const results = [
  await ensureUser({
    email: "s.ahmed@hgcare.co.uk",
    role: "platform_admin",
    organisationId: null,
    fullName: "S Ahmed",
  }),
  await ensureUser({
    email: "orgadmin@demo-care.test",
    role: "org_admin",
    organisationId: orgId,
    fullName: "Demo Org Admin",
  }),
  await ensureUser({
    email: "learner@demo-care.test",
    role: "learner",
    organisationId: orgId,
    fullName: "Demo Learner",
  }),
];

console.log(`\nOrganisation: ${ORG_NAME} (${orgId})`);
console.log(`Password for all: ${PASSWORD}\n`);
for (const r of results) {
  console.log(
    `  ${r.created ? "created" : "updated"}  ${r.role.padEnd(14)}  ${r.email}`,
  );
}
console.log("");
