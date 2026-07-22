package com.novacore.assets.util;

import com.novacore.assets.AssetType;

public final class AssetTypeResolver {

    private AssetTypeResolver() {
    }

    public static AssetType resolve(String mimeType, String extension) {
        if (mimeType != null) {
            String normalized = mimeType.toLowerCase();
            if ("application/pdf".equals(normalized)) {
                return AssetType.PDF;
            }
            if (normalized.startsWith("image/")) {
                return AssetType.IMAGE;
            }
            if (normalized.startsWith("video/")) {
                return AssetType.VIDEO;
            }
            if (normalized.startsWith("text/")) {
                return AssetType.NOTE;
            }
        }

        if (extension != null && "pdf".equalsIgnoreCase(extension)) {
            return AssetType.PDF;
        }

        return AssetType.FILE;
    }
}
