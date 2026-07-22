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
import org.springframework.http.HttpHeaders;
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
    void logout_success_revokesRefreshTokenInDatabase() throws Exception {
        AuthTokens tokens = registerAndLogin("logout.ok@novacore.test", "logoutok", "Secret123!");

        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken(tokens.refreshToken());

        mockMvc.perform(post("/v1/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokens.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        RefreshToken stored = refreshTokenRepository.findAll().getFirst();
        assertThat(stored.isRevoked()).isTrue();
    }

    @Test
    @Transactional
    void logout_alreadyRevokedToken_returnsSuccess() throws Exception {
        AuthTokens tokens = registerAndLogin("logout.revoked@novacore.test", "logoutrevoked", "Secret123!");

        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken(tokens.refreshToken());

        performLogout(tokens.accessToken(), logoutRequest);
        performLogout(tokens.accessToken(), logoutRequest);
    }

    @Test
    @Transactional
    void logout_unknownToken_returnsSuccessWithoutRevealingValidity() throws Exception {
        AuthTokens tokens = registerAndLogin("logout.unknown@novacore.test", "logoutunknown", "Secret123!");

        String unknownRefreshToken = jwtService.generateRefreshToken(tokens.userId(), "logoutunknown");

        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken(unknownRefreshToken);

        performLogout(tokens.accessToken(), logoutRequest);

        RefreshToken stored = refreshTokenRepository.findAll().getFirst();
        assertThat(stored.isRevoked()).isFalse();
    }

    @Test
    @Transactional
    void logout_expiredRefreshJwt_returnsSuccess() throws Exception {
        AuthTokens tokens = registerAndLogin("logout.expired@novacore.test", "logoutexpired", "Secret123!");

        String expiredRefreshToken = buildExpiredRefreshToken(tokens.userId(), "logoutexpired");

        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken(expiredRefreshToken);

        performLogout(tokens.accessToken(), logoutRequest);

        RefreshToken stored = refreshTokenRepository.findAll().getFirst();
        assertThat(stored.isRevoked()).isFalse();
    }

    @Test
    void logout_withoutAuthentication_returns401() throws Exception {
        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken("any.refresh.token");

        mockMvc.perform(post("/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @Test
    @Transactional
    void logout_idempotent_repeatedRequestsAlwaysReturnSuccess() throws Exception {
        AuthTokens tokens = registerAndLogin("logout.repeat@novacore.test", "logoutrepeat", "Secret123!");

        LogoutRequest logoutRequest = new LogoutRequest();
        logoutRequest.setRefreshToken(tokens.refreshToken());

        performLogout(tokens.accessToken(), logoutRequest);
        performLogout(tokens.accessToken(), logoutRequest);
        performLogout(tokens.accessToken(), logoutRequest);

        assertThat(refreshTokenRepository.findAll().getFirst().isRevoked()).isTrue();
    }

    private void performLogout(String accessToken, LogoutRequest logoutRequest) throws Exception {
        mockMvc.perform(post("/v1/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    private AuthTokens registerAndLogin(String email, String username, String password) throws Exception {
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

        return new AuthTokens(
                data.get("accessToken").asText(),
                data.get("refreshToken").asText(),
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

    private record AuthTokens(String accessToken, String refreshToken, UUID userId) {
    }
}
