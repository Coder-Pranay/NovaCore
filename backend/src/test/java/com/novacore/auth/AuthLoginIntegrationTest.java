package com.novacore.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
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

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthLoginIntegrationTest {

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

    @BeforeEach
    void cleanAuthData() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @Transactional
    void login_success_setsHttpOnlyCookiesAndPersistsOnlyHash() throws Exception {
        registerUser("login.ok@novacore.test", "loginok", "Secret123!");

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername("loginok");
        loginRequest.setPassword("Secret123!");

        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").doesNotExist())
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.data.tokenType").value("Cookie"))
                .andExpect(jsonPath("$.data.expiresIn").isNumber())
                .andExpect(jsonPath("$.data.user.email").value("login.ok@novacore.test"))
                .andExpect(jsonPath("$.data.user.username").value("loginok"))
                .andExpect(jsonPath("$.data.user.roles[0]").value("USER"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
                .andReturn();

        String access = AuthCookieTestHelper.requireCookieValue(result, AuthCookieTestHelper.ACCESS);
        String refresh = AuthCookieTestHelper.requireCookieValue(result, AuthCookieTestHelper.REFRESH);
        AuthCookieTestHelper.requireCookieValue(result, AuthCookieTestHelper.SESSION);

        assertThat(result.getResponse().getContentAsString()).doesNotContain(access);
        assertThat(result.getResponse().getContentAsString()).doesNotContain(refresh);
        assertThat(result.getResponse().getContentAsString()).doesNotContain("Secret123!");
        assertThat(refreshTokenRepository.findAll()).hasSize(1);

        var stored = refreshTokenRepository.findAll().getFirst();
        assertThat(stored.getTokenHash()).isEqualTo(refreshTokenService.hashToken(refresh));
        assertThat(stored.getTokenHash()).isNotEqualTo(refresh);
        assertThat(stored.getTokenHash()).hasSize(64);
        assertThat(stored.isRevoked()).isFalse();
        assertThat(access.split("\\.")).hasSize(3);

        mockMvc.perform(get("/v1/users/me").cookie(new Cookie(AuthCookieTestHelper.ACCESS, access)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("loginok"));
    }

    @Test
    void login_withEmail_succeeds() throws Exception {
        registerUser("email.login@novacore.test", "emaillogin", "Secret123!");

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername("email.login@novacore.test");
        loginRequest.setPassword("Secret123!");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.username").value("emaillogin"));
    }

    @Test
    void login_wrongPassword_returns401WithGenericMessage() throws Exception {
        registerUser("wrong.pw@novacore.test", "wrongpw", "Secret123!");

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername("wrongpw");
        loginRequest.setPassword("WrongPassword!");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_unknownUser_returns401WithGenericMessage() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername("nobody");
        loginRequest.setPassword("Secret123!");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_lockedUser_returns403() throws Exception {
        registerUser("locked@novacore.test", "lockeduser", "Secret123!");
        User user = userRepository.findByUsername("lockeduser").orElseThrow();
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername("lockeduser");
        loginRequest.setPassword("Secret123!");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("locked")));
    }

    @Test
    void login_inactiveUser_returns403() throws Exception {
        registerUser("inactive@novacore.test", "inactiveuser", "Secret123!");
        User user = userRepository.findByUsername("inactiveuser").orElseThrow();
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername("inactiveuser");
        loginRequest.setPassword("Secret123!");

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("inactive")));
    }

    private void registerUser(String email, String username, String password) throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setUsername(username);
        request.setPassword(password);
        request.setFirstName("Test");
        request.setLastName("User");

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
