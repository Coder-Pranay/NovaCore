package com.novacore.auth.exception;

import com.novacore.security.jwt.JwtException;

/**
 * Thrown when a token is malformed, forged, or otherwise invalid.
 */
public class InvalidTokenException extends JwtException {

    public InvalidTokenException(String message) {
        super(message);
    }

    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
