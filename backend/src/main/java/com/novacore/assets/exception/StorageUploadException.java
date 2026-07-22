package com.novacore.assets.exception;

/**
 * Raised when binary upload to object storage fails.
 */
public class StorageUploadException extends RuntimeException {

    public StorageUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}
