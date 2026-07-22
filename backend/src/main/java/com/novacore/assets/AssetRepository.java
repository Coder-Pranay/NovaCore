package com.novacore.assets;

import com.novacore.dashboard.projection.AssetTypeCountProjection;
import com.novacore.dashboard.projection.DashboardRecentUploadProjection;
import com.novacore.dashboard.projection.StorageUsageProjection;
import com.novacore.search.projection.AssetSearchProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    List<Asset> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Asset> findAllByOwnerIdAndArchivedFalseOrderByCreatedAtDesc(UUID ownerId);

    List<Asset> findAllBySpaceIdOrderByCreatedAtDesc(UUID spaceId);

    List<Asset> findAllBySpaceIdAndOwnerIdOrderByCreatedAtDesc(UUID spaceId, UUID ownerId);

    List<Asset> findAllBySpaceIdAndOwnerIdAndArchivedFalseOrderByCreatedAtDesc(UUID spaceId, UUID ownerId);

    Optional<Asset> findByIdAndOwnerId(UUID id, UUID ownerId);

    long countByOwnerIdAndArchivedFalse(UUID ownerId);

    @Query("""
            SELECT a.id AS id,
                   a.name AS name,
                   a.assetType AS assetType,
                   a.mimeType AS mimeType,
                   a.fileSize AS fileSize,
                   s.id AS spaceId,
                   s.name AS spaceName,
                   a.createdAt AS createdAt
            FROM Asset a
            JOIN a.space s
            WHERE a.owner.id = :ownerId
              AND a.archived = false
            ORDER BY a.createdAt DESC
            """)
    List<DashboardRecentUploadProjection> findRecentUploadProjectionsByOwnerId(
            @Param("ownerId") UUID ownerId,
            Pageable pageable);

    @Query("""
            SELECT COUNT(a) AS fileCount,
                   COALESCE(SUM(a.fileSize), 0) AS totalBytes
            FROM Asset a
            WHERE a.owner.id = :ownerId
              AND a.archived = false
              AND a.fileSize IS NOT NULL
            """)
    StorageUsageProjection getStorageUsageByOwnerId(@Param("ownerId") UUID ownerId);

    @Query("""
            SELECT a.assetType AS assetType,
                   COUNT(a) AS count
            FROM Asset a
            WHERE a.owner.id = :ownerId
              AND a.archived = false
            GROUP BY a.assetType
            """)
    List<AssetTypeCountProjection> countAssetsByTypeForOwner(@Param("ownerId") UUID ownerId);

    @Query("""
            SELECT a.id AS id,
                   a.name AS name,
                   a.description AS description,
                   a.assetType AS assetType,
                   a.favorite AS favorite,
                   s.id AS spaceId,
                   s.name AS spaceName,
                   a.createdAt AS createdAt
            FROM Asset a
            JOIN a.space s
            WHERE a.owner.id = :ownerId
              AND a.archived = false
              AND (LOWER(a.name) LIKE :keywordPattern
                   OR LOWER(COALESCE(a.description, '')) LIKE :keywordPattern)
            ORDER BY a.name ASC
            """)
    Page<AssetSearchProjection> searchByUserAndKeyword(
            @Param("ownerId") UUID ownerId,
            @Param("keywordPattern") String keywordPattern,
            Pageable pageable);
}
