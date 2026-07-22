import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "PPP",
): string {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? parseISO(value) : value;

  if (!isValid(date)) {
    return "";
  }

  return format(date, pattern);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, "PPP p");
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? parseISO(value) : value;

  if (!isValid(date)) {
    return "";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatIsoDate(value: Date): string {
  return value.toISOString();
}
