package com.novacore.auth;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Client metadata captured for refresh-token sessions.
 */
public record ClientDeviceInfo(String userAgent, String ipAddress) {

    public static ClientDeviceInfo from(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null || userAgent.isBlank()) {
            userAgent = "Unknown";
        } else if (userAgent.length() > 512) {
            userAgent = userAgent.substring(0, 512);
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            ip = ip.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }
        if (ip == null || ip.isBlank()) {
            ip = "unknown";
        } else if (ip.length() > 64) {
            ip = ip.substring(0, 64);
        }

        return new ClientDeviceInfo(userAgent, ip);
    }

    public static ClientDeviceInfo unknown() {
        return new ClientDeviceInfo("Unknown", "unknown");
    }
}
