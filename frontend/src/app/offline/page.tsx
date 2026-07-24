import type { Metadata } from "next";

import { OfflinePageContent } from "./offline-page-content";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-full flex-1 items-center justify-center p-6"
    >
      <OfflinePageContent />
    </main>
  );
}
