import { Loader } from "@/components/ui/loader";
import { cn } from "@/utils";

interface LoadingScreenProps {
  label?: string;
  className?: string;
}

export function LoadingScreen({
  label = "Loading NovaCore",
  className,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "bg-background flex min-h-screen flex-col items-center justify-center gap-4",
        className,
      )}
    >
      <Loader size="lg" label={label} />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
