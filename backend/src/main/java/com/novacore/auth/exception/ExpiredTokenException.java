package com.novacore.auth.exception;

import com.novacore.security.jwt.JwtException;

/**
 * Thrown when a token has passed its expiration time.
 */
public class ExpiredTokenException extends JwtException {

    public ExpiredTokenException(String message) {
        super(message);
    }

    public ExpiredTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
