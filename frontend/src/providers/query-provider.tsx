"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { createAppQueryClient, setQueryErrorHandler } from "@/lib/query-client";
import { getErrorMessage } from "@/utils";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  useEffect(() => {
    setQueryErrorHandler((error) => {
      toast.error(getErrorMessage(error));
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  );
}
