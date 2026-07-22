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

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6 md:p-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Frontend foundation ready for feature development.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sprint 9.1 Foundation</CardTitle>
          <CardDescription>
            Providers, design system, auth store, API client, and route
            protection are configured. Business modules start in Sprint 9.2+.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Next.js App Router</Badge>
          <Badge variant="secondary">TanStack Query</Badge>
          <Badge variant="secondary">Zustand</Badge>
          <Badge variant="secondary">Axios</Badge>
          <Badge variant="secondary">shadcn/ui</Badge>
          <Badge variant="secondary">Tailwind CSS</Badge>
        </CardContent>
      </Card>
    </main>
  );
}
