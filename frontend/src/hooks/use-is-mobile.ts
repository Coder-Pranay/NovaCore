"use client";

import { useEffect, useState } from "react";
import { BREAKPOINTS } from "@/constants";

export function useIsMobile(breakpoint = BREAKPOINTS.MOBILE): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const update = () => setIsMobile(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
