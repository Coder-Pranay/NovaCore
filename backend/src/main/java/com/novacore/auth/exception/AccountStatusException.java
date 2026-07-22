package com.novacore.auth.exception;

/**
 * Thrown when an authenticated account cannot sign in due to status (INACTIVE / LOCKED).
 */
public class AccountStatusException extends RuntimeException {

    public AccountStatusException(String message) {
        super(message);
    }
}
