export function GlobalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring focus:shadow"
      >
        Skip to main content
      </a>
      {/* Private AppShell and public pages own #main-content to avoid duplicate ids */}
      {children}
    </div>
  );
}
