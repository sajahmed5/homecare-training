import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardPathForRole, getUserContext } from "@/lib/auth";
import { Logo } from "@/components/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const context = await getUserContext();
  if (context) {
    redirect(dashboardPathForRole(context.role));
  }

  const { redirectTo } = await searchParams;
  // Only allow internal relative paths to prevent open-redirects.
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8">
        <Logo width={180} />
      </Link>
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Welcome back — sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={safeRedirect} />
        </CardContent>
      </Card>
    </main>
  );
}
