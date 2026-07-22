package com.novacore.common.exception;

/**
 * Raised when a create/update conflicts with an existing unique resource.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
