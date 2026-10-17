import type { Metadata } from "next";

import { SharedLinkLanding } from "@/features/sharing/components/shared-link-landing";

export const metadata: Metadata = {
  title: "Shared link",
  description: "Open a NovaCore public share link.",
  robots: { index: false, follow: false },
};

export default async function SharedLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedLinkLanding token={token} />;
}
