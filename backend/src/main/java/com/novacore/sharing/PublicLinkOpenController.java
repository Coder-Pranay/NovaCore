package com.novacore.sharing;

import com.novacore.common.api.ApiResponse;
import com.novacore.sharing.dto.AccessPublicLinkRequest;
import com.novacore.sharing.dto.PublicLinkAccessResponse;
import com.novacore.sharing.dto.PublicLinkPreviewResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unauthenticated open endpoints for public share links.
 * Content is never returned from GET; password-gated content uses POST access.
 */
@RestController
@RequestMapping("/v1/public-links/open")
public class PublicLinkOpenController {

    private final PublicLinkService publicLinkService;

    public PublicLinkOpenController(PublicLinkService publicLinkService) {
        this.publicLinkService = publicLinkService;
    }

    @GetMapping("/{token}")
    public ApiResponse<PublicLinkPreviewResponse> preview(@PathVariable String token) {
        PublicLinkPreviewResponse preview = publicLinkService.preview(token);
        return ApiResponse.success(preview, "Share preview retrieved successfully");
    }

    @PostMapping("/{token}")
    public ApiResponse<PublicLinkAccessResponse> access(
            @PathVariable String token,
            @Valid @RequestBody(required = false) AccessPublicLinkRequest request) {
        AccessPublicLinkRequest body = request == null ? new AccessPublicLinkRequest() : request;
        PublicLinkAccessResponse access = publicLinkService.access(token, body);
        return ApiResponse.success(access, "Share accessed successfully");
    }
}
