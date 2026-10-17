package com.novacore.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.ChangePasswordRequest;
import com.novacore.auth.dto.ForgotPasswordRequest;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.auth.dto.ResendVerificationRequest;
import com.novacore.auth.dto.ResetPasswordRequest;
import com.novacore.auth.dto.VerifyEmailRequest;
import com.novacore.mail.CapturingEmailService;
import com.novacore.users.User;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAccountSecurityIntegrationTest {

    private static final Pattern TOKEN_IN_URL = Pattern.compile("token=([A-Za-z0-9_-]+)");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private SecurityTokenRepository securityTokenRepository;

    @Autowired
    private CapturingEmailService capturingEmailService;

    @BeforeEach
    void clean() {
        refreshTokenRepository.deleteAll();
        securityTokenRepository.deleteAll();
        userRepository.deleteAll();
        capturingEmailService.clear();
    }

    @Test
    @Transactional
    void forgotPassword_alwaysReturnsGenericSuccess_andDoesNotEnumerate() throws Exception {
        ForgotPasswordRequest missing = new ForgotPasswordRequest();
        missing.setEmail("missing@novacore.test");

        mockMvc.perform(post("/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missing)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("If an account exists")));

        assertThat(capturingEmailService.getSent()).isEmpty();
    }

    @Test
    @Transactional
    void passwordResetFlow_invalidatesTokenAndRevokesSessions() throws Exception {
        registerUser("reset.user@novacore.test", "resetuser", "Secret123!");
        MvcResult login = login("resetuser", "Secret123!");
        assertThat(AuthCookieTestHelper.requireCookieValue(login, AuthCookieTestHelper.REFRESH)).isNotBlank();
        assertThat(refreshTokenRepository.findAll()).hasSize(1);

        ForgotPasswordRequest forgot = new ForgotPasswordRequest();
        forgot.setEmail("reset.user@novacore.test");
        mockMvc.perform(post("/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgot)))
                .andExpect(status().isOk());

        String token = extractTokenFromLatestEmail("Reset your NovaCore password");
        assertThat(securityTokenRepository.findAll()).isNotEmpty();
        String storedHash = securityTokenRepository.findAll().getFirst().getTokenHash();
        assertThat(storedHash).isNotEqualTo(token);
        assertThat(storedHash).hasSize(64);

        ResetPasswordRequest reset = new ResetPasswordRequest();
        reset.setToken(token);
        reset.setPassword("NewSecret123!");

        mockMvc.perform(post("/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reset)))
                .andExpect(status().isOk());

        assertThat(refreshTokenRepository.findAllByUserIdAndRevokedFalse(
                userRepository.findByEmail("reset.user@novacore.test").orElseThrow().getId())).isEmpty();

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest("resetuser", "Secret123!"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest("resetuser", "NewSecret123!"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reset)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Transactional
    void emailVerificationAndResend_workWithCooldown() throws Exception {
        registerUser("verify.user@novacore.test", "verifyuser", "Secret123!");
        User user = userRepository.findByEmail("verify.user@novacore.test").orElseThrow();
        assertThat(user.isEmailVerified()).isFalse();

        String token = extractTokenFromLatestEmail("Verify your NovaCore email");

        VerifyEmailRequest verify = new VerifyEmailRequest();
        verify.setToken(token);
        mockMvc.perform(post("/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isOk());

        user = userRepository.findByEmail("verify.user@novacore.test").orElseThrow();
        assertThat(user.isEmailVerified()).isTrue();

        mockMvc.perform(post("/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verify)))
                .andExpect(status().isBadRequest());

        capturingEmailService.clear();
        ResendVerificationRequest resend = new ResendVerificationRequest();
        resend.setEmail("verify.user@novacore.test");
        mockMvc.perform(post("/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resend)))
                .andExpect(status().isOk());
        assertThat(capturingEmailService.getSent()).isEmpty();
    }

    @Test
    @Transactional
    void changePasswordAndSessions_manageActiveDevices() throws Exception {
        registerUser("session.user@novacore.test", "sessionuser", "Secret123!");
        MvcResult login = login("sessionuser", "Secret123!");
        String access = AuthCookieTestHelper.requireCookieValue(login, AuthCookieTestHelper.ACCESS);
        String refresh = AuthCookieTestHelper.requireCookieValue(login, AuthCookieTestHelper.REFRESH);

        mockMvc.perform(get("/v1/auth/sessions")
                        .cookie(AuthCookieTestHelper.accessCookie(access), AuthCookieTestHelper.refreshCookie(refresh)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].current").value(true))
                .andExpect(jsonPath("$.data[0].device").isNotEmpty())
                .andExpect(jsonPath("$.data[0].browser").isNotEmpty())
                .andExpect(jsonPath("$.data[0].ipAddress").isNotEmpty());

        ChangePasswordRequest change = new ChangePasswordRequest();
        change.setCurrentPassword("Secret123!");
        change.setNewPassword("ChangedSecret1!");

        mockMvc.perform(post("/v1/auth/change-password")
                        .cookie(AuthCookieTestHelper.accessCookie(access), AuthCookieTestHelper.refreshCookie(refresh))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(change)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest("sessionuser", "Secret123!"))))
                .andExpect(status().isUnauthorized());

        MvcResult login2 = login("sessionuser", "ChangedSecret1!");
        String access2 = AuthCookieTestHelper.requireCookieValue(login2, AuthCookieTestHelper.ACCESS);
        String refresh2 = AuthCookieTestHelper.requireCookieValue(login2, AuthCookieTestHelper.REFRESH);

        mockMvc.perform(post("/v1/auth/sessions/revoke-others")
                        .cookie(AuthCookieTestHelper.accessCookie(access2), AuthCookieTestHelper.refreshCookie(refresh2)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/auth/sessions")
                        .cookie(AuthCookieTestHelper.accessCookie(access2), AuthCookieTestHelper.refreshCookie(refresh2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @Transactional
    void revokeSelectedSession_rejectsCurrentSession() throws Exception {
        registerUser("revoke.user@novacore.test", "revokeuser", "Secret123!");
        MvcResult login = login("revokeuser", "Secret123!");
        String access = AuthCookieTestHelper.requireCookieValue(login, AuthCookieTestHelper.ACCESS);
        String refresh = AuthCookieTestHelper.requireCookieValue(login, AuthCookieTestHelper.REFRESH);

        MvcResult sessions = mockMvc.perform(get("/v1/auth/sessions")
                        .cookie(AuthCookieTestHelper.accessCookie(access), AuthCookieTestHelper.refreshCookie(refresh)))
                .andExpect(status().isOk())
                .andReturn();

        String sessionId = objectMapper.readTree(sessions.getResponse().getContentAsString())
                .path("data").get(0).path("id").asText();

        mockMvc.perform(delete("/v1/auth/sessions/" + sessionId)
                        .cookie(AuthCookieTestHelper.accessCookie(access), AuthCookieTestHelper.refreshCookie(refresh)))
                .andExpect(status().isBadRequest());
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

    private MvcResult login(String username, String password) throws Exception {
        return mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest(username, password))))
                .andExpect(status().isOk())
                .andReturn();
    }

    private LoginRequest loginRequest(String username, String password) {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername(username);
        loginRequest.setPassword(password);
        return loginRequest;
    }

    private String extractTokenFromLatestEmail(String subject) {
        CapturingEmailService.SentMail exact = capturingEmailService.getSent().stream()
                .filter(m -> m.subject().equals(subject))
                .reduce((a, b) -> b)
                .orElseThrow(() -> new AssertionError("No email with subject " + subject));

        Matcher matcher = TOKEN_IN_URL.matcher(exact.textBody());
        assertThat(matcher.find()).as("token in email body").isTrue();
        return matcher.group(1);
    }
}
