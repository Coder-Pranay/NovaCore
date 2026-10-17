package com.novacore.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface SecurityTokenRepository extends JpaRepository<SecurityToken, UUID> {

    Optional<SecurityToken> findByTokenHashAndTokenType(String tokenHash, SecurityTokenType tokenType);

    Optional<SecurityToken> findFirstByUserIdAndTokenTypeAndUsedAtIsNullOrderByCreatedAtDesc(
            UUID userId,
            SecurityTokenType tokenType);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE SecurityToken t
            SET t.usedAt = :now
            WHERE t.user.id = :userId
              AND t.tokenType = :tokenType
              AND t.usedAt IS NULL
            """)
    int expireActiveTokens(
            @Param("userId") UUID userId,
            @Param("tokenType") SecurityTokenType tokenType,
            @Param("now") Instant now);
}
