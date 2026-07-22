package com.novacore.auth;

import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    private User user;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();

        user = new User();
        user.setEmail("token-user@novacore.test");
        user.setUsername("token_user");
        user.setPasswordHash("$2a$10$testhashplaceholder01234567890123456789012");
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);
    }

    @Test
    void saveAndFindByTokenHash() {
        RefreshToken token = newToken("hash-abc-001", Instant.now().plus(1, ChronoUnit.DAYS), false);

        RefreshToken saved = refreshTokenRepository.save(token);

        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHash("hash-abc-001");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
        assertThat(refreshTokenRepository.existsByTokenHash("hash-abc-001")).isTrue();
    }

    @Test
    void findActiveTokensByUser() {
        refreshTokenRepository.save(newToken("active-1", Instant.now().plus(1, ChronoUnit.DAYS), false));
        refreshTokenRepository.save(newToken("revoked-1", Instant.now().plus(1, ChronoUnit.DAYS), true));

        List<RefreshToken> active = refreshTokenRepository.findAllByUserIdAndRevokedFalse(user.getId());

        assertThat(active).hasSize(1);
        assertThat(active.getFirst().getTokenHash()).isEqualTo("active-1");
        assertThat(refreshTokenRepository.findAllByUserId(user.getId())).hasSize(2);
    }

    @Test
    void deleteExpiredTokens() {
        refreshTokenRepository.save(newToken("expired-1", Instant.now().minus(1, ChronoUnit.HOURS), false));
        refreshTokenRepository.save(newToken("valid-1", Instant.now().plus(1, ChronoUnit.DAYS), false));

        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());

        assertThat(refreshTokenRepository.findByTokenHash("expired-1")).isEmpty();
        assertThat(refreshTokenRepository.findByTokenHash("valid-1")).isPresent();
    }

    @Test
    void deleteAllByUserId() {
        refreshTokenRepository.save(newToken("to-delete-1", Instant.now().plus(1, ChronoUnit.DAYS), false));
        refreshTokenRepository.save(newToken("to-delete-2", Instant.now().plus(2, ChronoUnit.DAYS), false));

        refreshTokenRepository.deleteAllByUserId(user.getId());

        assertThat(refreshTokenRepository.findAllByUserId(user.getId())).isEmpty();
    }

    private RefreshToken newToken(String hash, Instant expiresAt, boolean revoked) {
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(hash);
        token.setExpiresAt(expiresAt);
        token.setRevoked(revoked);
        return token;
    }
}
