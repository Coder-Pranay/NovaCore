const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) {
    return "0 B";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${UNITS[exponent]}`;
}

export function parseFileSizeLabel(label: string): number | null {
  const match = label.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);

  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const unitIndex = UNITS.indexOf(unit as (typeof UNITS)[number]);

  if (Number.isNaN(value) || unitIndex === -1) {
    return null;
  }

  return Math.round(value * 1024 ** unitIndex);
}
