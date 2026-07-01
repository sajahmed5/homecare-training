import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SuspendedPage() {
  const context = await getUserContext();
  if (!context) redirect("/login");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account access suspended</CardTitle>
          <CardDescription>
            Your organisation&apos;s access to My Care Academy is currently
            suspended. Please contact your administrator or My Care Academy
            support if you believe this is a mistake.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
