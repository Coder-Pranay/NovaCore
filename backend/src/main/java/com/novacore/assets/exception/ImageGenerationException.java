package com.novacore.assets.exception;

import org.springframework.http.HttpStatus;

public class ImageGenerationException extends RuntimeException {

    private final HttpStatus status;

    public ImageGenerationException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public ImageGenerationException(String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
