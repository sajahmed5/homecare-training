import { createHmac } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { cleanup, createUser } from "./helpers";

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PW = "Test-Passw0rd!";

const userIds: string[] = [];

afterAll(async () => {
  await cleanup(userIds, []);
});

/** RFC 4648 base32 decode (no padding). */
function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input.replace(/=+$/, "").toUpperCase()) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** RFC 6238 TOTP (SHA1, 6 digits, 30s step). */
function totp(secret: string): string {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 1_000_000).toString().padStart(6, "0");
}

describe("MFA (TOTP) enrolment + step-up to AAL2", () => {
  it("enrols a factor and steps the session up to aal2", async () => {
    const email = `mfa-${RUN}@example.test`;
    const id = await createUser({
      email,
      password: PW,
      role: "platform_admin",
      organisationId: null,
    });
    userIds.push(id);

    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await client.auth.signInWithPassword({ email, password: PW });

    // Fresh password sign-in is AAL1.
    const { data: before } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    expect(before?.currentLevel).toBe("aal1");
    expect(before?.nextLevel).toBe("aal1"); // no factors yet

    // Enrol a TOTP factor.
    const { data: enrolled, error: enrolError } =
      await client.auth.mfa.enroll({ factorType: "totp" });
    expect(enrolError).toBeNull();
    const factorId = enrolled!.id;
    const secret = enrolled!.totp.secret;

    // Challenge + verify with a generated code.
    const { data: challenge } = await client.auth.mfa.challenge({ factorId });
    const { error: verifyError } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge!.id,
      code: totp(secret),
    });
    expect(verifyError).toBeNull();

    // Session is now AAL2.
    const { data: after } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    expect(after?.currentLevel).toBe("aal2");
    expect(after?.nextLevel).toBe("aal2");
  });
});
