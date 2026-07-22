package com.novacore.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private List<String> errors;
    private Instant timestamp;

    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.message = message;
        response.timestamp = Instant.now();
        return response;
    }

    public static ApiResponse<Void> failure(String message, List<String> errors) {
        ApiResponse<Void> response = new ApiResponse<>();
        response.success = false;
        response.message = message;
        response.errors = errors;
        response.timestamp = Instant.now();
        return response;
    }

    public boolean isSuccess() {
        return success;
    }

    public T getData() {
        return data;
    }

    public String getMessage() {
        return message;
    }

    public List<String> getErrors() {
        return errors;
    }

    public Instant getTimestamp() {
        return timestamp;
    }
}
