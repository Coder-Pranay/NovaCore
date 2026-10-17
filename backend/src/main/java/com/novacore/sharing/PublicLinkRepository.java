package com.novacore.sharing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PublicLinkRepository extends JpaRepository<PublicLink, UUID> {

    Optional<PublicLink> findByToken(String token);

    Optional<PublicLink> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<PublicLink> findByResourceTypeAndResourceIdAndEnabledTrue(
            ShareResourceType resourceType,
            UUID resourceId);

    List<PublicLink> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE PublicLink p
            SET p.enabled = false, p.updatedAt = CURRENT_TIMESTAMP
            WHERE p.owner.id = :ownerId
              AND p.resourceType = :resourceType
              AND p.resourceId = :resourceId
              AND p.enabled = true
            """)
    int disableActiveLinksForResource(
            @Param("ownerId") UUID ownerId,
            @Param("resourceType") ShareResourceType resourceType,
            @Param("resourceId") UUID resourceId);
}
