package com.novacore.auth;

/**
 * Lightweight User-Agent parsing for session display (device + browser).
 */
public final class UserAgentParser {

    private UserAgentParser() {
    }

    public static ParsedUserAgent parse(String userAgent) {
        if (userAgent == null || userAgent.isBlank() || "Unknown".equalsIgnoreCase(userAgent)) {
            return new ParsedUserAgent("Unknown device", "Unknown browser");
        }

        String ua = userAgent;
        String device = detectDevice(ua);
        String browser = detectBrowser(ua);
        return new ParsedUserAgent(device, browser);
    }

    private static String detectDevice(String ua) {
        String lower = ua.toLowerCase();
        if (lower.contains("ipad")) {
            return "iPad";
        }
        if (lower.contains("iphone")) {
            return "iPhone";
        }
        if (lower.contains("android")) {
            return "Android";
        }
        if (lower.contains("windows")) {
            return "Windows";
        }
        if (lower.contains("mac os") || lower.contains("macintosh")) {
            return "macOS";
        }
        if (lower.contains("linux")) {
            return "Linux";
        }
        return "Desktop";
    }

    private static String detectBrowser(String ua) {
        String lower = ua.toLowerCase();
        if (lower.contains("edg/")) {
            return "Edge";
        }
        if (lower.contains("chrome/") && !lower.contains("edg/")) {
            return "Chrome";
        }
        if (lower.contains("safari/") && !lower.contains("chrome/")) {
            return "Safari";
        }
        if (lower.contains("firefox/")) {
            return "Firefox";
        }
        if (lower.contains("opr/") || lower.contains("opera")) {
            return "Opera";
        }
        return "Unknown browser";
    }

    public record ParsedUserAgent(String device, String browser) {
    }
}
