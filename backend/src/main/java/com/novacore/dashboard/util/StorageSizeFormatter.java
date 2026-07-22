package com.novacore.dashboard.util;

public final class StorageSizeFormatter {

    private static final long KB = 1024L;
    private static final long MB = KB * 1024L;
    private static final long GB = MB * 1024L;
    private static final long TB = GB * 1024L;

    private StorageSizeFormatter() {
    }

    public static String formatBytes(long bytes) {
        if (bytes < 0) {
            return "0 B";
        }
        if (bytes < KB) {
            return bytes + " B";
        }
        if (bytes < MB) {
            return formatUnit(bytes, KB, "KB");
        }
        if (bytes < GB) {
            return formatUnit(bytes, MB, "MB");
        }
        if (bytes < TB) {
            return formatUnit(bytes, GB, "GB");
        }
        return formatUnit(bytes, TB, "TB");
    }

    private static String formatUnit(long bytes, long unit, String suffix) {
        double value = (double) bytes / unit;
        if (value >= 100) {
            return String.format("%.0f %s", value, suffix);
        }
        if (value >= 10) {
            return String.format("%.1f %s", value, suffix);
        }
        return String.format("%.2f %s", value, suffix);
    }
}
