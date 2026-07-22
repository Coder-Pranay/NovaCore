import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/providers";
import { GlobalLayout } from "@/components/layout";
import { ErrorBoundary } from "@/components/global/error-boundary";
import { OfflineView } from "@/components/global/offline-view";
import { RouteGuard } from "@/components/auth/route-guard";
import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders>
          <ErrorBoundary>
            <RouteGuard>
              <OfflineView />
              <GlobalLayout>{children}</GlobalLayout>
            </RouteGuard>
          </ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
