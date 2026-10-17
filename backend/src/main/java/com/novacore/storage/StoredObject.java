package com.novacore.storage;

import java.io.InputStream;

/**
 * Opened object from storage. Caller must close {@link #inputStream()}.
 */
public record StoredObject(
        InputStream inputStream,
        String contentType,
        Long contentLength
) {
}
