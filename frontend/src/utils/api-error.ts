import type { AxiosError } from "axios";
import type { ApiError, ErrorResponse } from "@/types";
import { isAxiosError } from "@/lib/api-client";

export function parseApiError(
  error: unknown,
  fallbackMessage = "Something went wrong",
): ApiError {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const responseData = axiosError.response?.data;

    return {
      message: responseData?.message ?? axiosError.message ?? fallbackMessage,
      status: axiosError.response?.status,
      errors: responseData?.errors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}

export function getErrorMessage(error: unknown, fallbackMessage?: string): string {
  return parseApiError(error, fallbackMessage).message;
}
