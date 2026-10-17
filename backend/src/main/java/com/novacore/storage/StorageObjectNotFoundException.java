package com.novacore.storage;

public class StorageObjectNotFoundException extends RuntimeException {

    public StorageObjectNotFoundException(String message) {
        super(message);
    }

    public StorageObjectNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
