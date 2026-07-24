"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/constants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = `${STORAGE_KEYS.USER_PREFERENCES}.pwaInstallDismissed`;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !deferred) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setDeferred(null);
  };

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Install NovaCore"
      className="border-border bg-background animate-in slide-in-from-bottom-4 fixed right-4 bottom-4 z-50 max-w-sm rounded-xl border p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <DownloadIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">Install NovaCore</p>
          <p className="text-muted-foreground text-xs">
            Add NovaCore to your device for faster access and an offline shell.
          </p>
          <div className="flex gap-2 pt-1">
            <Button type="button" size="sm" onClick={() => void install()}>
              Install
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Dismiss install prompt"
          onClick={dismiss}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
