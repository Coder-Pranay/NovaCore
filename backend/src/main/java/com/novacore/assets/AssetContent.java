package com.novacore.assets;

import java.io.InputStream;

public record AssetContent(
        InputStream inputStream,
        String contentType,
        Long contentLength,
        String filename
) {
}
