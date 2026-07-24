"use client";

import { splitHighlight } from "@/features/spaces/utils";
import { cn } from "@/utils";

interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string;
}

export function HighlightText({ text, query = "", className }: HighlightTextProps) {
  const parts = splitHighlight(text, query);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            key={`${part.text}-${index}`}
            className={cn(
              "bg-primary/20 text-foreground rounded-sm px-0.5",
              "dark:bg-primary/30",
            )}
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </span>
  );
}
