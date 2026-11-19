package com.novacore.assets;

import com.novacore.activity.ActionType;
import com.novacore.activity.ActivityLogService;
import com.novacore.activity.EntityType;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.assets.dto.AssetResponse;
import com.novacore.assets.dto.CreateAssetRequest;
import com.novacore.assets.dto.ImageGenStatusResponse;
import com.novacore.assets.dto.UpdateAssetRequest;
import com.novacore.assets.exception.AssetNotFoundException;
import com.novacore.assets.exception.ImageGenerationException;
import com.novacore.assets.exception.InvalidUploadException;
import com.novacore.assets.exception.StorageUploadException;
import com.novacore.assets.mapper.AssetMapper;
import com.novacore.assets.util.AssetTypeResolver;
import com.novacore.config.StorageProperties;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.spaces.Space;
import com.novacore.spaces.SpaceRepository;
import com.novacore.spaces.exception.SpaceNotFoundException;
import com.novacore.storage.ObjectStorageService;
import com.novacore.storage.StorageKeyGenerator;
import com.novacore.storage.StoredObject;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AssetService {

    private final AssetRepository assetRepository;
    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final AssetMapper assetMapper;
    private final ObjectStorageService objectStorageService;
    private final StorageProperties storageProperties;
    private final ActivityLogService activityLogService;
    private final ImageGenerationClient imageGenerationClient;

    public AssetService(
            AssetRepository assetRepository,
            SpaceRepository spaceRepository,
            UserRepository userRepository,
            AssetMapper assetMapper,
            ObjectStorageService objectStorageService,
            StorageProperties storageProperties,
            ActivityLogService activityLogService,
            ImageGenerationClient imageGenerationClient) {
        this.assetRepository = assetRepository;
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
        this.assetMapper = assetMapper;
        this.objectStorageService = objectStorageService;
        this.storageProperties = storageProperties;
        this.activityLogService = activityLogService;
        this.imageGenerationClient = imageGenerationClient;
    }

    @Transactional
    public AssetResponse uploadAsset(UUID spaceId, String description, MultipartFile file) {
        validateUploadFile(file);

        UUID ownerId = requireAuthenticatedUserId();
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));
        Space space = findOwnedSpace(spaceId, ownerId);

        String originalFilename = resolveOriginalFilename(file);
        String extension = extractExtension(originalFilename);
        String mimeType = resolveMimeType(file, extension);
        validateContentType(mimeType);

        String storageKey = StorageKeyGenerator.generate(ownerId, spaceId, originalFilename);

        try {
            objectStorageService.upload(storageKey, file.getInputStream(), file.getSize(), mimeType);
        } catch (IOException ex) {
            throw new StorageUploadException("Failed to read uploaded file", ex);
        } catch (RuntimeException ex) {
            throw new StorageUploadException("Failed to upload file to storage", ex);
        }

        Asset asset = new Asset();
        asset.setOwner(owner);
        asset.setSpace(space);
        asset.setName(extractDisplayName(originalFilename));
        asset.setDescription(normalizeOptionalText(description));
        asset.setAssetType(AssetTypeResolver.resolve(mimeType, extension));
        asset.setMimeType(mimeType);
        asset.setFileSize(file.getSize());
        asset.setStorageKey(storageKey);
        asset.setOriginalFilename(originalFilename);
        asset.setExtension(extension);
        asset.setFavorite(false);
        asset.setArchived(false);
        asset.setCreatedAt(Instant.now());
        asset.setUpdatedAt(Instant.now());

        Asset saved = assetRepository.save(asset);
        activityLogService.logActivity(
                ownerId,
                EntityType.ASSET,
                saved.getId(),
                ActionType.UPLOADED,
                "Uploaded " + originalFilename,
                "Added to " + space.getName() + " Space",
                Map.of(
                        "assetId", saved.getId().toString(),
                        "filename", originalFilename,
                        "spaceId", space.getId().toString(),
                        "spaceName", space.getName()));
        return assetMapper.toResponse(saved);
    }

    public ImageGenStatusResponse imageGenStatus() {
        requireAuthenticatedUserId();
        return imageGenerationClient.status();
    }

    public AssetResponse generateAsset(
            UUID spaceId,
            String prompt,
            String description,
            boolean adultConfirmed,
            MultipartFile referenceImage) {
        if (!adultConfirmed) {
            throw new ImageGenerationException(
                    "Confirm that all generated subjects are fictional adults.",
                    HttpStatus.BAD_REQUEST);
        }
        if (prompt == null || prompt.isBlank()) {
            throw new ImageGenerationException("Prompt is required", HttpStatus.BAD_REQUEST);
        }
        if (referenceImage != null && !referenceImage.isEmpty()) {
            String type = referenceImage.getContentType();
            if (type != null && !type.toLowerCase(Locale.ROOT).startsWith("image/")) {
                throw new ImageGenerationException("Reference file must be an image", HttpStatus.BAD_REQUEST);
            }
        }

        byte[] png = imageGenerationClient.generate(prompt.trim(), true, referenceImage);
        return storeGeneratedPng(spaceId, description, png);
    }

    private AssetResponse storeGeneratedPng(UUID spaceId, String description, byte[] png) {
        UUID ownerId = requireAuthenticatedUserId();
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));
        Space space = findOwnedSpace(spaceId, ownerId);

        String originalFilename = "moss-generated-" + Instant.now().toEpochMilli() + ".png";
        String mimeType = "image/png";
        String storageKey = StorageKeyGenerator.generate(ownerId, spaceId, originalFilename);

        try {
            objectStorageService.upload(
                    storageKey,
                    new ByteArrayInputStream(png),
                    png.length,
                    mimeType);
        } catch (RuntimeException ex) {
            throw new StorageUploadException("Failed to upload generated image to storage", ex);
        }

        Asset asset = new Asset();
        asset.setOwner(owner);
        asset.setSpace(space);
        asset.setName(extractDisplayName(originalFilename));
        asset.setDescription(normalizeOptionalText(description));
        asset.setAssetType(AssetTypeResolver.resolve(mimeType, "png"));
        asset.setMimeType(mimeType);
        asset.setFileSize((long) png.length);
        asset.setStorageKey(storageKey);
        asset.setOriginalFilename(originalFilename);
        asset.setExtension("png");
        asset.setFavorite(false);
        asset.setArchived(false);
        asset.setCreatedAt(Instant.now());
        asset.setUpdatedAt(Instant.now());

        Asset saved = assetRepository.save(asset);
        activityLogService.logActivity(
                ownerId,
                EntityType.ASSET,
                saved.getId(),
                ActionType.UPLOADED,
                "Generated " + originalFilename,
                "Moss LoRA image added to " + space.getName() + " Space",
                Map.of(
                        "assetId", saved.getId().toString(),
                        "filename", originalFilename,
                        "spaceId", space.getId().toString(),
                        "spaceName", space.getName(),
                        "source", "moss-lora"));
        return assetMapper.toResponse(saved);
    }

    @Transactional
    public AssetResponse createAsset(CreateAssetRequest request) {
        UUID ownerId = requireAuthenticatedUserId();
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));
        Space space = findOwnedSpace(request.getSpaceId(), ownerId);

        Asset asset = new Asset();
        asset.setOwner(owner);
        asset.setSpace(space);
        asset.setName(request.getName().trim());
        asset.setDescription(normalizeOptionalText(request.getDescription()));
        asset.setAssetType(request.getAssetType());
        asset.setMimeType(normalizeOptionalText(request.getMimeType()));
        asset.setFileSize(request.getFileSize());
        asset.setOriginalFilename(normalizeOptionalText(request.getOriginalFilename()));
        asset.setExtension(normalizeOptionalText(request.getExtension()));
        asset.setStorageKey(null);
        asset.setFavorite(false);
        asset.setArchived(false);
        asset.setCreatedAt(Instant.now());
        asset.setUpdatedAt(Instant.now());

        Asset saved = assetRepository.save(asset);
        activityLogService.logActivity(
                ownerId,
                EntityType.ASSET,
                saved.getId(),
                ActionType.CREATED,
                "Created " + saved.getName(),
                "Added to " + space.getName() + " Space",
                Map.of(
                        "assetId", saved.getId().toString(),
                        "assetName", saved.getName(),
                        "spaceId", space.getId().toString(),
                        "spaceName", space.getName()));
        return assetMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAssets(UUID spaceId) {
        UUID ownerId = requireAuthenticatedUserId();

        List<Asset> assets;
        if (spaceId != null) {
            findOwnedSpace(spaceId, ownerId);
            assets = assetRepository.findAllBySpaceIdAndOwnerIdAndArchivedFalseOrderByCreatedAtDesc(spaceId, ownerId);
        } else {
            assets = assetRepository.findAllByOwnerIdAndArchivedFalseOrderByCreatedAtDesc(ownerId);
        }

        return assets.stream().map(assetMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AssetResponse getAsset(UUID assetId) {
        UUID ownerId = requireAuthenticatedUserId();
        Asset asset = findOwnedAsset(assetId, ownerId);
        return assetMapper.toResponse(asset);
    }

    /**
     * Opens the stored binary for an owned asset. Caller must close the stream.
     */
    @Transactional(readOnly = true)
    public AssetContent openContent(UUID assetId) {
        UUID ownerId = requireAuthenticatedUserId();
        Asset asset = findOwnedAsset(assetId, ownerId);

        if (asset.getStorageKey() == null || asset.getStorageKey().isBlank()) {
            throw new AssetNotFoundException("No file is stored for this asset");
        }

        try {
            StoredObject stored = objectStorageService.download(asset.getStorageKey());
            String contentType = asset.getMimeType() != null && !asset.getMimeType().isBlank()
                    ? asset.getMimeType()
                    : stored.contentType();
            String filename = asset.getOriginalFilename() != null && !asset.getOriginalFilename().isBlank()
                    ? asset.getOriginalFilename()
                    : asset.getName();
            Long length = asset.getFileSize() != null ? asset.getFileSize() : stored.contentLength();
            return new AssetContent(stored.inputStream(), contentType, length, filename);
        } catch (com.novacore.storage.StorageObjectNotFoundException ex) {
            throw new AssetNotFoundException("Stored file not found");
        } catch (RuntimeException ex) {
            throw new StorageUploadException("Failed to download file from storage", ex);
        }
    }

    @Transactional
    public AssetResponse updateAsset(UUID assetId, UpdateAssetRequest request) {
        UUID ownerId = requireAuthenticatedUserId();
        Asset asset = findOwnedAsset(assetId, ownerId);

        asset.setName(request.getName().trim());
        asset.setDescription(normalizeOptionalText(request.getDescription()));

        if (request.getAssetType() != null) {
            asset.setAssetType(request.getAssetType());
        }
        if (request.getMimeType() != null) {
            asset.setMimeType(normalizeOptionalText(request.getMimeType()));
        }
        if (request.getFileSize() != null) {
            asset.setFileSize(request.getFileSize());
        }
        if (request.getOriginalFilename() != null) {
            asset.setOriginalFilename(normalizeOptionalText(request.getOriginalFilename()));
        }
        if (request.getExtension() != null) {
            asset.setExtension(normalizeOptionalText(request.getExtension()));
        }
        if (request.getFavorite() != null) {
            asset.setFavorite(request.getFavorite());
        }

        asset.setUpdatedAt(Instant.now());

        Asset saved = assetRepository.save(asset);
        activityLogService.logActivity(
                ownerId,
                EntityType.ASSET,
                saved.getId(),
                ActionType.UPDATED,
                "Updated " + saved.getName(),
                null,
                Map.of("assetId", saved.getId().toString(), "assetName", saved.getName()));
        return assetMapper.toResponse(saved);
    }

    @Transactional
    public AssetResponse archiveAsset(UUID assetId) {
        UUID ownerId = requireAuthenticatedUserId();
        Asset asset = findOwnedAsset(assetId, ownerId);

        asset.setArchived(true);
        asset.setUpdatedAt(Instant.now());

        Asset saved = assetRepository.save(asset);
        activityLogService.logActivity(
                ownerId,
                EntityType.ASSET,
                saved.getId(),
                ActionType.ARCHIVED,
                "Archived " + saved.getName(),
                null,
                Map.of("assetId", saved.getId().toString(), "assetName", saved.getName()));
        return assetMapper.toResponse(saved);
    }

    private void validateUploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidUploadException("File must not be empty");
        }

        long maxBytes = storageProperties.getMaxFileSize().toBytes();
        if (file.getSize() > maxBytes) {
            throw new InvalidUploadException(
                    "File exceeds maximum allowed size of " + storageProperties.getMaxFileSize());
        }
    }

    private void validateContentType(String mimeType) {
        List<String> allowed = storageProperties.getAllowedContentTypes();
        if (allowed == null || allowed.isEmpty()) {
            return;
        }

        boolean permitted = allowed.stream()
                .anyMatch(rule -> matchesContentTypeRule(mimeType, rule));

        if (!permitted) {
            throw new InvalidUploadException("File type is not allowed: " + mimeType);
        }
    }

    private static boolean matchesContentTypeRule(String mimeType, String rule) {
        if (rule.endsWith("/*")) {
            String prefix = rule.substring(0, rule.length() - 1).toLowerCase(Locale.ROOT);
            return mimeType.toLowerCase(Locale.ROOT).startsWith(prefix);
        }
        return rule.equalsIgnoreCase(mimeType);
    }

    private static String resolveOriginalFilename(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            return "upload";
        }
        return Paths.get(filename).getFileName().toString();
    }

    private static String extractDisplayName(String originalFilename) {
        return StorageKeyGenerator.sanitizeFilename(originalFilename);
    }

    private static String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return null;
        }
        return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private static String resolveMimeType(MultipartFile file, String extension) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank() && !"application/octet-stream".equalsIgnoreCase(contentType)) {
            return contentType;
        }
        if ("pdf".equalsIgnoreCase(extension)) {
            return "application/pdf";
        }
        return contentType != null && !contentType.isBlank() ? contentType : "application/octet-stream";
    }

    private Asset findOwnedAsset(UUID assetId, UUID ownerId) {
        return assetRepository.findByIdAndOwnerId(assetId, ownerId)
                .orElseThrow(AssetNotFoundException::new);
    }

    private Space findOwnedSpace(UUID spaceId, UUID ownerId) {
        return spaceRepository.findByIdAndOwnerId(spaceId, ownerId)
                .orElseThrow(SpaceNotFoundException::new);
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return authenticatedUser.userId();
    }

    private static String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
