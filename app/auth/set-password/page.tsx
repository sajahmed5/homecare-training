import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage() {
  const context = await getUserContext();
  if (!context) redirect("/login");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
          <CardDescription>
            Welcome to My Care Academy, {context.email}. Choose a password to
            finish setting up your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
