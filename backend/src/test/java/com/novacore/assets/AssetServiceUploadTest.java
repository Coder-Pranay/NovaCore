package com.novacore.assets;

import com.novacore.activity.ActivityLogService;
import com.novacore.assets.dto.AssetResponse;
import com.novacore.assets.exception.InvalidUploadException;
import com.novacore.assets.exception.StorageUploadException;
import com.novacore.assets.mapper.AssetMapper;
import com.novacore.config.StorageProperties;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.spaces.Space;
import com.novacore.spaces.SpaceRepository;
import com.novacore.spaces.exception.SpaceNotFoundException;
import com.novacore.storage.ObjectStorageService;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.unit.DataSize;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.InputStream;

@ExtendWith(MockitoExtension.class)
class AssetServiceUploadTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AssetMapper assetMapper;

    @Mock
    private ObjectStorageService objectStorageService;

    @Mock
    private StorageProperties storageProperties;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private AssetService assetService;

    private UUID ownerId;
    private UUID spaceId;
    private User owner;
    private Space space;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ownerId = UUID.randomUUID();
        spaceId = UUID.randomUUID();

        owner = new User();
        owner.setId(ownerId);

        space = new Space();
        space.setId(spaceId);
        space.setOwner(owner);
        space.setName("Health");
        space.setSlug("health");

        authenticateAs(ownerId, "alice");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void uploadAsset_success_persistsMetadataAndUploadsToStorage() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "report.pdf",
                "application/pdf",
                "pdf-content".getBytes());

        when(storageProperties.getMaxFileSize()).thenReturn(DataSize.ofMegabytes(50));
        when(storageProperties.getAllowedContentTypes()).thenReturn(List.of());
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.findByIdAndOwnerId(spaceId, ownerId)).thenReturn(Optional.of(space));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> {
            Asset saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(assetMapper.toResponse(any(Asset.class))).thenAnswer(invocation -> {
            Asset asset = invocation.getArgument(0);
            AssetResponse response = new AssetResponse();
            response.setId(asset.getId());
            response.setName(asset.getName());
            response.setAssetType(asset.getAssetType());
            response.setMimeType(asset.getMimeType());
            response.setFileSize(asset.getFileSize());
            return response;
        });

        AssetResponse response = assetService.uploadAsset(spaceId, "Annual report", file);

        assertThat(response.getName()).isEqualTo("report.pdf");
        assertThat(response.getAssetType()).isEqualTo(AssetType.PDF);
        assertThat(response.getMimeType()).isEqualTo("application/pdf");
        assertThat(response.getFileSize()).isEqualTo(file.getSize());

        ArgumentCaptor<Asset> assetCaptor = ArgumentCaptor.forClass(Asset.class);
        verify(assetRepository).save(assetCaptor.capture());
        Asset persisted = assetCaptor.getValue();
        assertThat(persisted.getStorageKey())
                .startsWith("users/" + ownerId + "/spaces/" + spaceId + "/")
                .endsWith("-report.pdf");
        assertThat(persisted.getOriginalFilename()).isEqualTo("report.pdf");
        assertThat(persisted.getExtension()).isEqualTo("pdf");
        assertThat(persisted.getDescription()).isEqualTo("Annual report");

        verify(objectStorageService).upload(
                eq(persisted.getStorageKey()),
                any(InputStream.class),
                eq(file.getSize()),
                eq("application/pdf"));
    }

    @Test
    void uploadAsset_emptyFile_throwsInvalidUpload() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> assetService.uploadAsset(spaceId, null, file))
                .isInstanceOf(InvalidUploadException.class)
                .hasMessage("File must not be empty");

        verify(objectStorageService, never()).upload(anyString(), any(), anyLong(), anyString());
        verify(assetRepository, never()).save(any());
    }

    @Test
    void uploadAsset_spaceNotOwned_throwsNotFound() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "report.pdf",
                "application/pdf",
                "pdf-content".getBytes());

        when(storageProperties.getMaxFileSize()).thenReturn(DataSize.ofMegabytes(50));
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.findByIdAndOwnerId(spaceId, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> assetService.uploadAsset(spaceId, null, file))
                .isInstanceOf(SpaceNotFoundException.class);

        verify(objectStorageService, never()).upload(anyString(), any(), anyLong(), anyString());
    }

    @Test
    void uploadAsset_fileTooLarge_throwsInvalidUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "large.pdf",
                "application/pdf",
                "pdf-content".getBytes());

        when(storageProperties.getMaxFileSize()).thenReturn(DataSize.ofBytes(1));

        assertThatThrownBy(() -> assetService.uploadAsset(spaceId, null, file))
                .isInstanceOf(InvalidUploadException.class)
                .hasMessageContaining("maximum allowed size");
    }

    @Test
    void uploadAsset_disallowedMimeType_throwsInvalidUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "script.exe",
                "application/octet-stream",
                "binary".getBytes());

        when(storageProperties.getMaxFileSize()).thenReturn(DataSize.ofMegabytes(50));
        when(storageProperties.getAllowedContentTypes()).thenReturn(List.of("application/pdf", "image/*"));
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.findByIdAndOwnerId(spaceId, ownerId)).thenReturn(Optional.of(space));

        assertThatThrownBy(() -> assetService.uploadAsset(spaceId, null, file))
                .isInstanceOf(InvalidUploadException.class)
                .hasMessageContaining("File type is not allowed");
    }

    @Test
    void uploadAsset_storageFailure_throwsStorageUploadException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "report.pdf",
                "application/pdf",
                "pdf-content".getBytes());

        when(storageProperties.getMaxFileSize()).thenReturn(DataSize.ofMegabytes(50));
        when(storageProperties.getAllowedContentTypes()).thenReturn(List.of());
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.findByIdAndOwnerId(spaceId, ownerId)).thenReturn(Optional.of(space));
        doThrow(new RuntimeException("MinIO unavailable"))
                .when(objectStorageService)
                .upload(anyString(), any(), anyLong(), anyString());

        assertThatThrownBy(() -> assetService.uploadAsset(spaceId, null, file))
                .isInstanceOf(StorageUploadException.class)
                .hasMessage("Failed to upload file to storage");

        verify(assetRepository, never()).save(any());
    }

    private void authenticateAs(UUID userId, String username) {
        AuthenticatedUser principal = new AuthenticatedUser(userId, username);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
