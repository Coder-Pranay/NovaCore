package com.novacore.spaces.exception;

/**
 * Raised when a Life Space cannot be found for the authenticated owner.
 */
public class SpaceNotFoundException extends RuntimeException {

    public SpaceNotFoundException() {
        super("Space not found");
    }
}
