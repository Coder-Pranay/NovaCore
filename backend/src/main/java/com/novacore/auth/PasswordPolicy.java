package com.novacore.auth;

import java.util.regex.Pattern;

/**
 * Strong password rules aligned with the frontend password schema.
 */
public final class PasswordPolicy {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 100;
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9]");

    private PasswordPolicy() {
    }

    public static void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("Password must be at least " + MIN_LENGTH + " characters");
        }
        if (password.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Password must be at most " + MAX_LENGTH + " characters");
        }
        if (!UPPERCASE.matcher(password).find()) {
            throw new IllegalArgumentException("Password must include an uppercase letter");
        }
        if (!LOWERCASE.matcher(password).find()) {
            throw new IllegalArgumentException("Password must include a lowercase letter");
        }
        if (!DIGIT.matcher(password).find()) {
            throw new IllegalArgumentException("Password must include a number");
        }
        if (!SPECIAL.matcher(password).find()) {
            throw new IllegalArgumentException("Password must include a special character");
        }
    }
}
