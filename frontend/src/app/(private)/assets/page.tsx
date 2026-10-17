import type { Metadata } from "next";

import { AssetsPage } from "@/features/assets/components/assets-page";

export const metadata: Metadata = {
  title: "Assets",
  description: "Upload and manage NovaCore assets.",
  robots: { index: false, follow: false },
};

export default function AssetsRoutePage() {
  return <AssetsPage />;
}
