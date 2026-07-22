import { Loader2 } from "lucide-react";

import { cn } from "@/utils";

interface LoaderProps {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

export function Loader({
  className,
  label = "Loading",
  size = "md",
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
