"use client";

import { useEffect } from "react";

/**
 * Registers the shell service worker in production builds only.
 * Development skips registration to avoid stale-cache friction.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const register = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (registration) => {
            // Drop stale workers from earlier builds so they cannot serve old routes.
            if (registration.active?.scriptURL.endsWith("/sw.js")) {
              return;
            }
            await registration.unregister();
          }),
        );
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.warn("Service worker registration failed", error);
      }
    };

    void register();
  }, []);

  return null;
}
