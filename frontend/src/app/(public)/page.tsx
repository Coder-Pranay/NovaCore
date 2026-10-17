import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APP_NAME } from "@/constants";
import Link from "next/link";
import { ROUTES } from "@/constants";

export default function PublicHomePage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6 md:p-10"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Personal digital OS
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{APP_NAME}</h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
            Organize your digital life into Life Spaces. Store files, find them
            fast, and share securely with password-protected links.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.LOGIN}
          className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-lg px-5 text-sm font-medium"
        >
          Sign in
        </Link>
        <Link
          href={ROUTES.REGISTER}
          className="border-border hover:bg-muted inline-flex h-10 items-center rounded-lg border px-5 text-sm font-medium"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
