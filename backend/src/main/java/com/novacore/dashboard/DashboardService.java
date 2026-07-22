package com.novacore.dashboard;

import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.assets.AssetRepository;
import com.novacore.assets.AssetType;
import com.novacore.dashboard.dto.DashboardAssetSummary;
import com.novacore.dashboard.dto.DashboardQuickStatistics;
import com.novacore.dashboard.dto.DashboardRecentUpload;
import com.novacore.dashboard.dto.DashboardResponse;
import com.novacore.dashboard.dto.DashboardSpaceSummary;
import com.novacore.dashboard.dto.DashboardStorageSummary;
import com.novacore.dashboard.dto.DashboardUserSummary;
import com.novacore.dashboard.projection.AssetTypeCountProjection;
import com.novacore.dashboard.projection.DashboardRecentUploadProjection;
import com.novacore.dashboard.projection.StorageUsageProjection;
import com.novacore.dashboard.util.StorageSizeFormatter;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.spaces.SpaceRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardService {

    private static final int RECENT_UPLOAD_LIMIT = 10;

    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;
    private final AssetRepository assetRepository;

    public DashboardService(
            UserRepository userRepository,
            SpaceRepository spaceRepository,
            AssetRepository assetRepository) {
        this.userRepository = userRepository;
        this.spaceRepository = spaceRepository;
        this.assetRepository = assetRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        UUID ownerId = requireAuthenticatedUserId();
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));

        DashboardResponse response = new DashboardResponse();
        response.setUser(buildUserSummary(user));
        response.setSpaces(buildSpaceSummary(ownerId));
        response.setAssets(buildAssetSummary(ownerId));
        response.setStorage(buildStorageSummary(ownerId));
        response.setStatistics(buildQuickStatistics(ownerId));
        return response;
    }

    private DashboardUserSummary buildUserSummary(User user) {
        DashboardUserSummary summary = new DashboardUserSummary();
        summary.setFirstName(user.getFirstName());
        summary.setProfileImageUrl(user.getProfileImageUrl());
        return summary;
    }

    private DashboardSpaceSummary buildSpaceSummary(UUID ownerId) {
        DashboardSpaceSummary summary = new DashboardSpaceSummary();
        summary.setTotalSpaces(spaceRepository.countByOwnerIdAndArchivedFalse(ownerId));
        summary.setFavoriteSpaces(spaceRepository.countByOwnerIdAndArchivedFalseAndFavoriteTrue(ownerId));
        return summary;
    }

    private DashboardAssetSummary buildAssetSummary(UUID ownerId) {
        DashboardAssetSummary summary = new DashboardAssetSummary();
        summary.setTotalAssets(assetRepository.countByOwnerIdAndArchivedFalse(ownerId));
        summary.setRecentUploads(loadRecentUploads(ownerId));
        return summary;
    }

    private List<DashboardRecentUpload> loadRecentUploads(UUID ownerId) {
        return assetRepository
                .findRecentUploadProjectionsByOwnerId(ownerId, PageRequest.of(0, RECENT_UPLOAD_LIMIT))
                .stream()
                .map(this::toRecentUpload)
                .toList();
    }

    private DashboardRecentUpload toRecentUpload(DashboardRecentUploadProjection projection) {
        DashboardRecentUpload upload = new DashboardRecentUpload();
        upload.setId(projection.getId());
        upload.setName(projection.getName());
        upload.setAssetType(projection.getAssetType());
        upload.setMimeType(projection.getMimeType());
        upload.setFileSize(projection.getFileSize());
        upload.setSpaceId(projection.getSpaceId());
        upload.setSpaceName(projection.getSpaceName());
        upload.setCreatedAt(projection.getCreatedAt());
        return upload;
    }

    private DashboardStorageSummary buildStorageSummary(UUID ownerId) {
        StorageUsageProjection usage = assetRepository.getStorageUsageByOwnerId(ownerId);
        long totalBytes = usage != null ? usage.getTotalBytes() : 0L;
        long fileCount = usage != null ? usage.getFileCount() : 0L;

        DashboardStorageSummary summary = new DashboardStorageSummary();
        summary.setTotalFileCount(fileCount);
        summary.setTotalBytesUsed(totalBytes);
        summary.setFormattedSize(StorageSizeFormatter.formatBytes(totalBytes));
        return summary;
    }

    private DashboardQuickStatistics buildQuickStatistics(UUID ownerId) {
        Map<AssetType, Long> countsByType = new EnumMap<>(AssetType.class);
        for (AssetTypeCountProjection projection : assetRepository.countAssetsByTypeForOwner(ownerId)) {
            countsByType.put(projection.getAssetType(), projection.getCount());
        }

        DashboardQuickStatistics statistics = new DashboardQuickStatistics();
        statistics.setImages(countsByType.getOrDefault(AssetType.IMAGE, 0L));
        statistics.setDocuments(
                countsByType.getOrDefault(AssetType.DOCUMENT, 0L)
                        + countsByType.getOrDefault(AssetType.PDF, 0L));
        statistics.setVideos(countsByType.getOrDefault(AssetType.VIDEO, 0L));
        statistics.setNotes(countsByType.getOrDefault(AssetType.NOTE, 0L));
        statistics.setLinks(countsByType.getOrDefault(AssetType.LINK, 0L));
        return statistics;
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return authenticatedUser.userId();
    }
}
