import type { LucideIcon } from "lucide-react";
import { AlertCircleIcon } from "lucide-react";

import { cn } from "@/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  icon: Icon = AlertCircleIcon,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{message}</p>
      </div>
      {action}
    </div>
  );
}
