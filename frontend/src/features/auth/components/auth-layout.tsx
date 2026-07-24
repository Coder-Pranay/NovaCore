import { APP_NAME } from "@/constants";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="bg-muted/40 relative hidden flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl text-sm font-bold"
          >
            NC
          </div>
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight">
            Your personal digital operating system
          </h2>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Securely organize spaces, assets, and activity in one enterprise-ready
            platform built for clarity and control.
          </p>
        </div>
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      <div className={cn("flex flex-col", className)}>
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <div
              aria-hidden="true"
              className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-xs font-bold"
            >
              NC
            </div>
            <span className="font-semibold">{APP_NAME}</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-10">
          <main id="main-content" className="w-full max-w-md space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
