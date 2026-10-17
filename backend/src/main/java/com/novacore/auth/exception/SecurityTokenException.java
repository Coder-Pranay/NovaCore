package com.novacore.auth.exception;

/**
 * Invalid or expired one-time security token (password reset / email verification).
 */
public class SecurityTokenException extends RuntimeException {

    public SecurityTokenException(String message) {
        super(message);
    }
}
