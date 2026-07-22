package com.novacore.spaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpaceRepository extends JpaRepository<Space, UUID> {

    List<Space> findAllByOwnerIdOrderByDisplayOrderAsc(UUID ownerId);

    List<Space> findAllByOwnerIdAndArchivedFalseOrderByDisplayOrderAsc(UUID ownerId);

    Optional<Space> findByIdAndOwnerId(UUID id, UUID ownerId);

    boolean existsByOwnerIdAndSlug(UUID ownerId, String slug);

    boolean existsByOwnerIdAndSlugAndIdNot(UUID ownerId, String slug, UUID id);

    int countByOwnerId(UUID ownerId);

    long countByOwnerIdAndArchivedFalse(UUID ownerId);

    long countByOwnerIdAndArchivedFalseAndFavoriteTrue(UUID ownerId);

    @Query("""
            SELECT s
            FROM Space s
            WHERE s.owner.id = :ownerId
              AND s.archived = false
              AND (LOWER(s.name) LIKE :keywordPattern
                   OR LOWER(COALESCE(s.description, '')) LIKE :keywordPattern)
            ORDER BY s.name ASC
            """)
    Page<Space> searchByUserAndKeyword(
            @Param("ownerId") UUID ownerId,
            @Param("keywordPattern") String keywordPattern,
            Pageable pageable);
}
