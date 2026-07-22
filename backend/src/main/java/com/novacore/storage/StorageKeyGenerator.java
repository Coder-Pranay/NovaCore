package com.novacore.storage;

import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public final class StorageKeyGenerator {

    private static final DateTimeFormatter YEAR_FORMAT = DateTimeFormatter.ofPattern("yyyy").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MM").withZone(ZoneOffset.UTC);

    private StorageKeyGenerator() {
    }

    public static String generate(UUID userId, UUID spaceId, String originalFilename) {
        Instant now = Instant.now();
        String year = YEAR_FORMAT.format(now);
        String month = MONTH_FORMAT.format(now);
        String safeFilename = sanitizeFilename(originalFilename);
        UUID objectId = UUID.randomUUID();

        return "users/%s/spaces/%s/%s/%s/%s-%s".formatted(
                userId,
                spaceId,
                year,
                month,
                objectId,
                safeFilename);
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "upload";
        }

        String basename = Paths.get(filename).getFileName().toString();
        String sanitized = basename.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("_+", "_");
        return sanitized.isBlank() ? "upload" : sanitized;
    }
}
