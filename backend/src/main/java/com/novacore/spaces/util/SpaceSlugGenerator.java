package com.novacore.spaces.util;

/**
 * Generates URL-safe slugs for Life Spaces.
 */
public final class SpaceSlugGenerator {

    private static final String FALLBACK_SLUG = "space";

    private SpaceSlugGenerator() {
    }

    public static String toSlug(String value) {
        if (value == null || value.isBlank()) {
            return FALLBACK_SLUG;
        }

        String slug = value.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        return slug.isBlank() ? FALLBACK_SLUG : slug;
    }

    public static String resolveUniqueSlug(String baseSlug, java.util.function.Predicate<String> slugExists) {
        String candidate = toSlug(baseSlug);
        if (!slugExists.test(candidate)) {
            return candidate;
        }

        for (int suffix = 2; suffix < 10_000; suffix++) {
            String uniqueCandidate = candidate + "-" + suffix;
            if (!slugExists.test(uniqueCandidate)) {
                return uniqueCandidate;
            }
        }

        throw new IllegalStateException("Unable to generate a unique slug");
    }
}
