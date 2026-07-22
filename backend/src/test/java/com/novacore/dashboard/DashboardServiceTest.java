package com.novacore.dashboard;

import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.assets.AssetRepository;
import com.novacore.assets.AssetType;
import com.novacore.dashboard.dto.DashboardResponse;
import com.novacore.dashboard.projection.AssetTypeCountProjection;
import com.novacore.dashboard.projection.DashboardRecentUploadProjection;
import com.novacore.dashboard.projection.StorageUsageProjection;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.spaces.SpaceRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private UUID ownerId;
    private User user;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ownerId = UUID.randomUUID();

        user = new User();
        user.setId(ownerId);
        user.setFirstName("Nova");
        user.setProfileImageUrl("https://cdn.example/avatar.png");

        authenticateAs(ownerId, "nova");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getDashboard_returnsAggregatedSummary() {
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(user));
        when(spaceRepository.countByOwnerIdAndArchivedFalse(ownerId)).thenReturn(3L);
        when(spaceRepository.countByOwnerIdAndArchivedFalseAndFavoriteTrue(ownerId)).thenReturn(1L);
        when(assetRepository.countByOwnerIdAndArchivedFalse(ownerId)).thenReturn(5L);
        when(assetRepository.findRecentUploadProjectionsByOwnerId(eq(ownerId), any(Pageable.class)))
                .thenReturn(List.of(recentUploadProjection()));
        when(assetRepository.getStorageUsageByOwnerId(ownerId)).thenReturn(storageUsageProjection(2, 2048));
        when(assetRepository.countAssetsByTypeForOwner(ownerId)).thenReturn(List.of(
                typeCount(AssetType.IMAGE, 2),
                typeCount(AssetType.DOCUMENT, 1),
                typeCount(AssetType.PDF, 1),
                typeCount(AssetType.VIDEO, 1)));

        DashboardResponse response = dashboardService.getDashboard();

        assertThat(response.getUser().getFirstName()).isEqualTo("Nova");
        assertThat(response.getUser().getProfileImageUrl()).isEqualTo("https://cdn.example/avatar.png");
        assertThat(response.getSpaces().getTotalSpaces()).isEqualTo(3);
        assertThat(response.getSpaces().getFavoriteSpaces()).isEqualTo(1);
        assertThat(response.getAssets().getTotalAssets()).isEqualTo(5);
        assertThat(response.getAssets().getRecentUploads()).hasSize(1);
        assertThat(response.getAssets().getRecentUploads().getFirst().getSpaceName()).isEqualTo("Health");
        assertThat(response.getStorage().getTotalFileCount()).isEqualTo(2);
        assertThat(response.getStorage().getTotalBytesUsed()).isEqualTo(2048);
        assertThat(response.getStorage().getFormattedSize()).isEqualTo("2.00 KB");
        assertThat(response.getStatistics().getImages()).isEqualTo(2);
        assertThat(response.getStatistics().getDocuments()).isEqualTo(2);
        assertThat(response.getStatistics().getVideos()).isEqualTo(1);
        assertThat(response.getStatistics().getNotes()).isZero();
        assertThat(response.getStatistics().getLinks()).isZero();
    }

    @Test
    void getDashboard_withoutAuthentication_throwsUnauthorized() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> dashboardService.getDashboard())
                .isInstanceOf(AuthenticationFailedException.class);
    }

    private DashboardRecentUploadProjection recentUploadProjection() {
        UUID assetId = UUID.randomUUID();
        UUID spaceId = UUID.randomUUID();
        Instant createdAt = Instant.parse("2026-07-22T10:00:00Z");

        return new DashboardRecentUploadProjection() {
            @Override
            public UUID getId() {
                return assetId;
            }

            @Override
            public String getName() {
                return "report.pdf";
            }

            @Override
            public AssetType getAssetType() {
                return AssetType.PDF;
            }

            @Override
            public String getMimeType() {
                return "application/pdf";
            }

            @Override
            public Long getFileSize() {
                return 1024L;
            }

            @Override
            public UUID getSpaceId() {
                return spaceId;
            }

            @Override
            public String getSpaceName() {
                return "Health";
            }

            @Override
            public Instant getCreatedAt() {
                return createdAt;
            }
        };
    }

    private StorageUsageProjection storageUsageProjection(long fileCount, long totalBytes) {
        return new StorageUsageProjection() {
            @Override
            public long getFileCount() {
                return fileCount;
            }

            @Override
            public long getTotalBytes() {
                return totalBytes;
            }
        };
    }

    private AssetTypeCountProjection typeCount(AssetType type, long count) {
        return new AssetTypeCountProjection() {
            @Override
            public AssetType getAssetType() {
                return type;
            }

            @Override
            public long getCount() {
                return count;
            }
        };
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
