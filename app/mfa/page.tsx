import { redirect } from "next/navigation";
import { dashboardPathForRole, getUserContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MfaSetup } from "./mfa-setup";

export default async function MfaPage() {
  const context = await getUserContext();
  if (!context) redirect("/login");

  const supabase = await createClient();

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  // Already fully verified — nothing to do here.
  if (aal?.currentLevel === "aal2") {
    redirect(dashboardPathForRole(context.role));
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
  const mode = verifiedTotp ? "challenge" : "enroll";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {mode === "challenge"
              ? "Two-factor verification"
              : "Secure your account"}
          </CardTitle>
          <CardDescription>My Care Academy · {context.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSetup mode={mode} factorId={verifiedTotp?.id} />
        </CardContent>
      </Card>
    </main>
  );
}
