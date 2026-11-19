package com.novacore.common.exception;

import com.novacore.auth.exception.AccountStatusException;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.auth.exception.RateLimitException;
import com.novacore.auth.exception.SecurityTokenException;
import com.novacore.common.api.ApiResponse;
import com.novacore.spaces.exception.SpaceNotFoundException;
import com.novacore.assets.exception.AssetNotFoundException;
import com.novacore.assets.exception.ImageGenerationException;
import com.novacore.assets.exception.InvalidUploadException;
import com.novacore.assets.exception.StorageUploadException;
import com.novacore.search.exception.InvalidSearchQueryException;
import com.novacore.sharing.exception.InvalidSharePasswordException;
import com.novacore.sharing.exception.PublicLinkNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .toList();

        return ResponseEntity.badRequest()
                .body(ApiResponse.failure("Validation failed", errors));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationFailed(AuthenticationFailedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(AccountStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccountStatus(AccountStatusException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(SecurityTokenException.class)
    public ResponseEntity<ApiResponse<Void>> handleSecurityToken(SecurityTokenException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<ApiResponse<Void>> handleRateLimit(RateLimitException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(SpaceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleSpaceNotFound(SpaceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(AssetNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleAssetNotFound(AssetNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(PublicLinkNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handlePublicLinkNotFound(PublicLinkNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(InvalidSharePasswordException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidSharePassword(InvalidSharePasswordException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(InvalidUploadException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidUpload(InvalidUploadException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(ImageGenerationException.class)
    public ResponseEntity<ApiResponse<Void>> handleImageGeneration(ImageGenerationException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(InvalidSearchQueryException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidSearchQuery(InvalidSearchQueryException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(StorageUploadException.class)
    public ResponseEntity<ApiResponse<Void>> handleStorageUpload(StorageUploadException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure(ex.getMessage(), List.of(ex.getMessage())));
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }
}
