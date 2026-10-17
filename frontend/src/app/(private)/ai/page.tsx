"use client";

import { SparklesIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

/**
 * Assistant route kept for bookmarks / deep links, but not linked in primary nav
 * until a real AI provider is connected.
 */
export default function AiRoutePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8">
      <EmptyState
        icon={SparklesIcon}
        title="Assistant is not available yet"
        description="We're connecting an AI provider before this feature ships. It is hidden from navigation so it is not mistaken for a live chat."
      />
    </div>
  );
}
