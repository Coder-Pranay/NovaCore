package com.novacore.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RefreshTokenRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthRefreshIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

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
    void refresh_viaCookie_rotatesTokensAndStoresOnlyHash() throws Exception {
        MvcResult loginResult = login("refresh.ok@novacore.test", "refreshok");
        String oldRefresh = AuthCookieTestHelper.requireCookieValue(loginResult, AuthCookieTestHelper.REFRESH);

        MvcResult result = mockMvc.perform(post("/v1/auth/refresh")
                        .cookie(AuthCookieTestHelper.refreshCookie(loginResult))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").doesNotExist())
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.data.tokenType").value("Cookie"))
                .andExpect(jsonPath("$.data.expiresIn").isNumber())
                .andReturn();

        String newRefresh = AuthCookieTestHelper.requireCookieValue(result, AuthCookieTestHelper.REFRESH);
        assertThat(newRefresh).isNotEqualTo(oldRefresh);
        assertThat(refreshTokenRepository.findAll()).hasSize(2);

        RefreshToken oldStored = refreshTokenRepository.findByTokenHash(refreshTokenService.hashToken(oldRefresh))
                .orElseThrow();
        assertThat(oldStored.isRevoked()).isTrue();

        RefreshToken newStored = refreshTokenRepository.findByTokenHash(refreshTokenService.hashToken(newRefresh))
                .orElseThrow();
        assertThat(newStored.isRevoked()).isFalse();
        assertThat(newStored.getTokenHash()).isNotEqualTo(newRefresh);
        assertThat(newStored.getTokenHash()).hasSize(64);
    }

    @Test
    void refresh_oldCookieUnusableAfterRotation() throws Exception {
        MvcResult loginResult = login("rotate@novacore.test", "rotateuser");
        Cookie oldRefreshCookie = AuthCookieTestHelper.refreshCookie(loginResult);

        mockMvc.perform(post("/v1/auth/refresh")
                        .cookie(oldRefreshCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/v1/auth/refresh")
                        .cookie(oldRefreshCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    void refresh_accessTokenRejected() throws Exception {
        login("access.rej@novacore.test", "accessrej");
        var user = userRepository.findByUsername("accessrej").orElseThrow();
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken(accessToken);

        mockMvc.perform(post("/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    void refresh_unknownToken_returns401() throws Exception {
        String forged = jwtService.generateRefreshToken(UUID.randomUUID(), "ghost");

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken(forged);

        mockMvc.perform(post("/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    void refresh_revokedToken_returns401() throws Exception {
        MvcResult loginResult = login("revoked@novacore.test", "revokeduser");
        String refresh = AuthCookieTestHelper.requireCookieValue(loginResult, AuthCookieTestHelper.REFRESH);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(refreshTokenService.hashToken(refresh))
                .orElseThrow();
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        mockMvc.perform(post("/v1/auth/refresh")
                        .cookie(new Cookie(AuthCookieTestHelper.REFRESH, refresh))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    void refresh_expiredJwt_returns401() throws Exception {
        Duration original = jwtProperties.getRefreshTokenExpiration();
        try {
            jwtProperties.setRefreshTokenExpiration(Duration.ofMillis(1));
            JwtService shortLived = new JwtService(jwtProperties);
            var userId = UUID.randomUUID();
            String expired = shortLived.generateRefreshToken(userId, "expired");
            Thread.sleep(20);

            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken(expired);

            mockMvc.perform(post("/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid refresh token"));
        } finally {
            jwtProperties.setRefreshTokenExpiration(original);
        }
    }

    private MvcResult login(String email, String username) throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail(email);
        register.setUsername(username);
        register.setPassword("Secret123!");
        register.setFirstName("Test");
        register.setLastName("User");

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest();
        login.setEmailOrUsername(username);
        login.setPassword("Secret123!");

        return mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
    }
}
