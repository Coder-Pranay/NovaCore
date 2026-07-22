package com.novacore.storage;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class StorageKeyGeneratorTest {

    @Test
    void generate_buildsExpectedPath() {
        UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID spaceId = UUID.fromString("22222222-2222-2222-2222-222222222222");

        String key = StorageKeyGenerator.generate(userId, spaceId, "My Report.pdf");

        assertThat(key)
                .startsWith("users/" + userId + "/spaces/" + spaceId + "/")
                .containsPattern("/\\d{4}/\\d{2}/")
                .endsWith("-My_Report.pdf");
    }

    @Test
    void sanitizeFilename_stripsUnsafeCharacters() {
        assertThat(StorageKeyGenerator.sanitizeFilename("../secret/report.pdf")).isEqualTo("report.pdf");
        assertThat(StorageKeyGenerator.sanitizeFilename("  ")).isEqualTo("upload");
    }
}
