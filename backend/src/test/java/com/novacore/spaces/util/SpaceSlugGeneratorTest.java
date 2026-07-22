package com.novacore.spaces.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SpaceSlugGeneratorTest {

    @Test
    void toSlug_normalizesName() {
        assertThat(SpaceSlugGenerator.toSlug("Personal Finance")).isEqualTo("personal-finance");
        assertThat(SpaceSlugGenerator.toSlug("  Health & Wellness!!! ")).isEqualTo("health-wellness");
    }

    @Test
    void resolveUniqueSlug_appendsSuffixWhenTaken() {
        String slug = SpaceSlugGenerator.resolveUniqueSlug("health", candidate -> candidate.equals("health"));

        assertThat(slug).isEqualTo("health-2");
    }
}
