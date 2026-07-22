package com.novacore.assets;

import com.novacore.assets.dto.AssetResponse;
import com.novacore.assets.dto.CreateAssetRequest;
import com.novacore.assets.dto.UpdateAssetRequest;
import com.novacore.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AssetResponse> createAsset(@Valid @RequestBody CreateAssetRequest request) {
        AssetResponse asset = assetService.createAsset(request);
        return ApiResponse.success(asset, "Asset created successfully");
    }

    @GetMapping
    public ApiResponse<List<AssetResponse>> getAssets(@RequestParam(required = false) UUID spaceId) {
        List<AssetResponse> assets = assetService.getAssets(spaceId);
        return ApiResponse.success(assets, "Assets retrieved successfully");
    }

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AssetResponse> uploadAsset(
            @RequestParam("file") MultipartFile file,
            @RequestParam("spaceId") UUID spaceId,
            @RequestParam(value = "description", required = false) String description) {
        AssetResponse asset = assetService.uploadAsset(spaceId, description, file);
        return ApiResponse.success(asset, "File uploaded successfully");
    }

    @GetMapping("/{id}")
    public ApiResponse<AssetResponse> getAsset(@PathVariable UUID id) {
        AssetResponse asset = assetService.getAsset(id);
        return ApiResponse.success(asset, "Asset retrieved successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<AssetResponse> updateAsset(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAssetRequest request) {
        AssetResponse asset = assetService.updateAsset(id, request);
        return ApiResponse.success(asset, "Asset updated successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<AssetResponse> archiveAsset(@PathVariable UUID id) {
        AssetResponse asset = assetService.archiveAsset(id);
        return ApiResponse.success(asset, "Asset archived successfully");
    }
}
