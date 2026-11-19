package com.novacore.assets;

import com.novacore.activity.ActivityLogService;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.assets.dto.AssetResponse;
import com.novacore.assets.dto.CreateAssetRequest;
import com.novacore.assets.dto.UpdateAssetRequest;
import com.novacore.assets.exception.AssetNotFoundException;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

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

    @Mock
    private ImageGenerationClient imageGenerationClient;

    @InjectMocks
    private AssetService assetService;

    private UUID ownerId;
    private UUID spaceId;
    private User owner;
    private Space space;
    private Asset asset;
    private AssetResponse assetResponse;

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

        asset = new Asset();
        asset.setId(UUID.randomUUID());
        asset.setOwner(owner);
        asset.setSpace(space);
        asset.setName("Blood Test Report");
        asset.setAssetType(AssetType.PDF);
        asset.setCreatedAt(Instant.now());
        asset.setUpdatedAt(Instant.now());

        assetResponse = new AssetResponse();
        assetResponse.setId(asset.getId());
        assetResponse.setOwnerId(ownerId);
        assetResponse.setSpaceId(spaceId);
        assetResponse.setName("Blood Test Report");
        assetResponse.setAssetType(AssetType.PDF);

        authenticateAs(ownerId, "alice");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createAsset_success() {
        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(spaceId);
        request.setName("Blood Test Report");
        request.setAssetType(AssetType.PDF);
        request.setMimeType("application/pdf");
        request.setOriginalFilename("report.pdf");
        request.setExtension("pdf");

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.findByIdAndOwnerId(spaceId, ownerId)).thenReturn(Optional.of(space));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> {
            Asset saved = invocation.getArgument(0);
            saved.setId(asset.getId());
            return saved;
        });
        when(assetMapper.toResponse(any(Asset.class))).thenReturn(assetResponse);

        AssetResponse result = assetService.createAsset(request);

        assertThat(result.getName()).isEqualTo("Blood Test Report");
        verify(assetRepository).save(any(Asset.class));
    }

    @Test
    void createAsset_spaceNotOwned_throwsNotFound() {
        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(spaceId);
        request.setName("Report");
        request.setAssetType(AssetType.DOCUMENT);

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.findByIdAndOwnerId(spaceId, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> assetService.createAsset(request))
                .isInstanceOf(SpaceNotFoundException.class);

        verify(assetRepository, never()).save(any());
    }

    @Test
    void getAssets_returnsActiveAssetsForOwner() {
        when(assetRepository.findAllByOwnerIdAndArchivedFalseOrderByCreatedAtDesc(ownerId))
                .thenReturn(List.of(asset));
        when(assetMapper.toResponse(asset)).thenReturn(assetResponse);

        List<AssetResponse> result = assetService.getAssets(null);

        assertThat(result).hasSize(1);
    }

    @Test
    void getAssets_bySpace_verifiesOwnership() {
        when(spaceRepository.findByIdAndOwnerId(spaceId, ownerId)).thenReturn(Optional.of(space));
        when(assetRepository.findAllBySpaceIdAndOwnerIdAndArchivedFalseOrderByCreatedAtDesc(spaceId, ownerId))
                .thenReturn(List.of(asset));
        when(assetMapper.toResponse(asset)).thenReturn(assetResponse);

        List<AssetResponse> result = assetService.getAssets(spaceId);

        assertThat(result).hasSize(1);
        verify(spaceRepository).findByIdAndOwnerId(spaceId, ownerId);
    }

    @Test
    void getAsset_notOwned_throwsNotFound() {
        UUID assetId = UUID.randomUUID();
        when(assetRepository.findByIdAndOwnerId(assetId, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> assetService.getAsset(assetId))
                .isInstanceOf(AssetNotFoundException.class);
    }

    @Test
    void updateAsset_success() {
        UpdateAssetRequest request = new UpdateAssetRequest();
        request.setName("Updated Report");
        request.setDescription("Annual checkup");
        request.setFavorite(true);

        when(assetRepository.findByIdAndOwnerId(asset.getId(), ownerId)).thenReturn(Optional.of(asset));
        when(assetRepository.save(asset)).thenReturn(asset);
        when(assetMapper.toResponse(asset)).thenReturn(assetResponse);

        assetService.updateAsset(asset.getId(), request);

        assertThat(asset.getName()).isEqualTo("Updated Report");
        assertThat(asset.getDescription()).isEqualTo("Annual checkup");
        assertThat(asset.isFavorite()).isTrue();
    }

    @Test
    void archiveAsset_marksArchived() {
        when(assetRepository.findByIdAndOwnerId(asset.getId(), ownerId)).thenReturn(Optional.of(asset));
        when(assetRepository.save(asset)).thenReturn(asset);
        when(assetMapper.toResponse(asset)).thenReturn(assetResponse);

        assetService.archiveAsset(asset.getId());

        assertThat(asset.isArchived()).isTrue();
        verify(assetRepository).save(asset);
    }

    @Test
    void createAsset_withoutAuthentication_throwsUnauthorized() {
        SecurityContextHolder.clearContext();

        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(spaceId);
        request.setName("Report");
        request.setAssetType(AssetType.NOTE);

        assertThatThrownBy(() -> assetService.createAsset(request))
                .isInstanceOf(AuthenticationFailedException.class);
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
