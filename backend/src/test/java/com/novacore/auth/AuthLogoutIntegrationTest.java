package com.novacore.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.LogoutRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.security.jwt.JwtClaims;
import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.users.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthLogoutIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtProperties jwtProperties;

    @BeforeEach
    void cleanAuthData() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @Transactional
    void logout_viaCookie_revokesRefreshTokenAndClearsCookies() throws Exception {
        AuthSession session = registerAndLogin("logout.ok@novacore.test", "logoutok", "Secret123!");

        MvcResult logoutResult = mockMvc.perform(post("/v1/auth/logout")
                        .cookie(session.accessCookie(), session.refreshCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andReturn();

        RefreshToken stored = refreshTokenRepository.findAll().getFirst();
        assertThat(stored.isRevoked()).isTrue();
        assertThat(AuthCookieTestHelper.hasClearedCookie(logoutResult, AuthCookieTestHelper.ACCESS)).isTrue();
        assertThat(AuthCookieTestHelper.hasClearedCookie(logoutResult, AuthCookieTestHelper.REFRESH)).isTrue();
        assertThat(AuthCookieTestHelper.hasClearedCookie(logoutResult, AuthCookieTestHelper.SESSION)).isTrue();
    }

    @Test
    @Transactional
    void logout_alreadyRevokedToken_returnsSuccess() throws Exception {
        AuthSession session = registerAndLogin("logout.revoked@novacore.test", "logoutrevoked", "Secret123!");
        performLogout(session);
        performLogout(session);
    }

    @Test
    @Transactional
    void logout_unknownToken_returnsSuccessWithoutRevealingValidity() throws Exception {
        AuthSession session = registerAndLogin("logout.unknown@novacore.test", "logoutunknown", "Secret123!");

        String unknownRefreshToken = jwtService.generateRefreshToken(session.userId(), "logoutunknown");
        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken(unknownRefreshToken);

        mockMvc.perform(post("/v1/auth/logout")
                        .cookie(session.accessCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk());

        RefreshToken stored = refreshTokenRepository.findAll().getFirst();
        assertThat(stored.isRevoked()).isFalse();
    }

    @Test
    @Transactional
    void logout_expiredRefreshJwt_returnsSuccess() throws Exception {
        AuthSession session = registerAndLogin("logout.expired@novacore.test", "logoutexpired", "Secret123!");

        String expiredRefreshToken = buildExpiredRefreshToken(session.userId(), "logoutexpired");
        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken(expiredRefreshToken);

        mockMvc.perform(post("/v1/auth/logout")
                        .cookie(session.accessCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk());

        RefreshToken stored = refreshTokenRepository.findAll().getFirst();
        assertThat(stored.isRevoked()).isFalse();
    }

    @Test
    void logout_withoutCookies_stillReturnsSuccess() throws Exception {
        mockMvc.perform(post("/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    @Test
    @Transactional
    void logout_idempotent_repeatedRequestsAlwaysReturnSuccess() throws Exception {
        AuthSession session = registerAndLogin("logout.repeat@novacore.test", "logoutrepeat", "Secret123!");

        performLogout(session);
        performLogout(session);
        performLogout(session);

        assertThat(refreshTokenRepository.findAll().getFirst().isRevoked()).isTrue();
    }

    private void performLogout(AuthSession session) throws Exception {
        mockMvc.perform(post("/v1/auth/logout")
                        .cookie(session.accessCookie(), session.refreshCookie())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    private AuthSession registerAndLogin(String email, String username, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail(email);
        registerRequest.setUsername(username);
        registerRequest.setPassword(password);
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername(username);
        loginRequest.setPassword(password);

        MvcResult loginResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("data");
        UUID userId = UUID.fromString(data.get("user").get("id").asText());

        return new AuthSession(
                AuthCookieTestHelper.accessCookie(loginResult),
                AuthCookieTestHelper.refreshCookie(loginResult),
                userId);
    }

    private String buildExpiredRefreshToken(UUID userId, String username) {
        SecretKey secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
        Instant issuedAt = Instant.now().minus(Duration.ofDays(8));
        Instant expiresAt = Instant.now().minus(Duration.ofDays(1));

        return Jwts.builder()
                .subject(username)
                .issuer(jwtProperties.getIssuer())
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .claims(Map.of(
                        JwtService.CLAIM_USER_ID, userId.toString(),
                        JwtService.CLAIM_TOKEN_TYPE, JwtClaims.TYPE_REFRESH))
                .signWith(secretKey)
                .compact();
    }

    private record AuthSession(Cookie accessCookie, Cookie refreshCookie, UUID userId) {
    }
}
