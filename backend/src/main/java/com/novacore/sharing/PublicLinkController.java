package com.novacore.sharing;

import com.novacore.common.api.ApiResponse;
import com.novacore.sharing.dto.CreatePublicLinkRequest;
import com.novacore.sharing.dto.PublicLinkResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/public-links")
public class PublicLinkController {

    private final PublicLinkService publicLinkService;

    public PublicLinkController(PublicLinkService publicLinkService) {
        this.publicLinkService = publicLinkService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PublicLinkResponse> create(@Valid @RequestBody CreatePublicLinkRequest request) {
        PublicLinkResponse link = publicLinkService.create(request);
        return ApiResponse.success(link, "Public link created successfully");
    }

    @GetMapping
    public ApiResponse<List<PublicLinkResponse>> listMine() {
        List<PublicLinkResponse> links = publicLinkService.listMine();
        return ApiResponse.success(links, "Public links retrieved successfully");
    }

    @GetMapping("/resource")
    public ApiResponse<PublicLinkResponse> getForResource(
            @RequestParam ShareResourceType resourceType,
            @RequestParam UUID resourceId) {
        PublicLinkResponse link = publicLinkService.getActiveForResource(resourceType, resourceId);
        return ApiResponse.success(link, "Public link retrieved successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<PublicLinkResponse> disable(@PathVariable UUID id) {
        PublicLinkResponse link = publicLinkService.disable(id);
        return ApiResponse.success(link, "Public link disabled successfully");
    }
}
