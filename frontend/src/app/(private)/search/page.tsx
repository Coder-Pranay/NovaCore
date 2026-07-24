import type { Metadata } from "next";

import { SearchPage } from "@/features/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search spaces and assets across NovaCore.",
  robots: { index: false, follow: false },
};

export default function SearchRoutePage() {
  return <SearchPage />;
}
