package com.novacore.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findAllByUserId(UUID userId);

    List<RefreshToken> findAllByUserIdAndRevokedFalse(UUID userId);

    boolean existsByTokenHash(String tokenHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    void deleteAllByUserId(UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    void deleteByExpiresAtBefore(Instant instant);
}
