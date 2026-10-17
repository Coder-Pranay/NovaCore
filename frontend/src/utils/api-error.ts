import type { AxiosError } from "axios";
import type { ApiError, ErrorResponse } from "@/types";
import { isAxiosError } from "@/lib/api-client";

function isApiErrorShape(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  );
}

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

  // Axios interceptor already rejects with a parsed ApiError — preserve it.
  if (isApiErrorShape(error)) {
    return {
      message: error.message || fallbackMessage,
      status: error.status,
      errors: error.errors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage };
  }

  return { message: fallbackMessage };
}

export function getErrorMessage(error: unknown, fallbackMessage?: string): string {
  return parseApiError(error, fallbackMessage).message;
}
