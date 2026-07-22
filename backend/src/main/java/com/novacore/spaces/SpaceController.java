package com.novacore.spaces;

import com.novacore.common.api.ApiResponse;
import com.novacore.spaces.dto.CreateSpaceRequest;
import com.novacore.spaces.dto.SpaceResponse;
import com.novacore.spaces.dto.UpdateSpaceRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/spaces")
public class SpaceController {

    private final SpaceService spaceService;

    public SpaceController(SpaceService spaceService) {
        this.spaceService = spaceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SpaceResponse> createSpace(@Valid @RequestBody CreateSpaceRequest request) {
        SpaceResponse space = spaceService.createSpace(request);
        return ApiResponse.success(space, "Space created successfully");
    }

    @GetMapping
    public ApiResponse<List<SpaceResponse>> getMySpaces() {
        List<SpaceResponse> spaces = spaceService.getMySpaces();
        return ApiResponse.success(spaces, "Spaces retrieved successfully");
    }

    @GetMapping("/{id}")
    public ApiResponse<SpaceResponse> getSpaceById(@PathVariable UUID id) {
        SpaceResponse space = spaceService.getSpaceById(id);
        return ApiResponse.success(space, "Space retrieved successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<SpaceResponse> updateSpace(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSpaceRequest request) {
        SpaceResponse space = spaceService.updateSpace(id, request);
        return ApiResponse.success(space, "Space updated successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<SpaceResponse> archiveSpace(@PathVariable UUID id) {
        SpaceResponse space = spaceService.archiveSpace(id);
        return ApiResponse.success(space, "Space archived successfully");
    }
}
