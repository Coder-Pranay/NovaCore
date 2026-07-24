import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import Link from "next/link";
import { ROUTES } from "@/constants";

export default function PublicHomePage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6 md:p-10"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enterprise authentication is ready. Feature modules start in Sprint 9.3+.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to NovaCore</CardTitle>
          <CardDescription>
            Sign in to access your dashboard, spaces, assets, and search.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.LOGIN}
            className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium"
          >
            Sign in
          </Link>
          <Badge variant="secondary">Sprint 9.2 Authentication</Badge>
        </CardContent>
      </Card>
    </main>
  );
}
