package com.novacore.users;

import com.novacore.auth.AuthCookieTestHelper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.users.dto.UpdateUserProfileRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.novacore.auth.RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void cleanUsers() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @Transactional
    void getCurrentProfile_returnsAuthenticatedUserProfile() throws Exception {
        AuthSession session = registerAndLogin("profile.get@novacore.test", "profileget", "Secret123!");

        mockMvc.perform(get("/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile retrieved successfully"))
                .andExpect(jsonPath("$.data.email").value("profile.get@novacore.test"))
                .andExpect(jsonPath("$.data.username").value("profileget"))
                .andExpect(jsonPath("$.data.firstName").value("Nova"))
                .andExpect(jsonPath("$.data.lastName").value("User"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.roles[0]").value("USER"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    @Transactional
    void updateProfile_updatesEditableFieldsOnly() throws Exception {
        AuthSession session = registerAndLogin("profile.update@novacore.test", "profileupdate", "Secret123!");

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFirstName("Updated");
        request.setLastName("Profile");
        request.setPhoneNumber("+1 555-123-4567");

        mockMvc.perform(put("/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                .andExpect(jsonPath("$.data.firstName").value("Updated"))
                .andExpect(jsonPath("$.data.lastName").value("Profile"))
                .andExpect(jsonPath("$.data.phoneNumber").value("+1 555-123-4567"))
                .andExpect(jsonPath("$.data.email").value("profile.update@novacore.test"))
                .andExpect(jsonPath("$.data.username").value("profileupdate"))
                .andExpect(jsonPath("$.data.roles[0]").value("USER"));

        var saved = userRepository.findByUsername("profileupdate").orElseThrow();
        assertThat(saved.getFirstName()).isEqualTo("Updated");
        assertThat(saved.getLastName()).isEqualTo("Profile");
        assertThat(saved.getPhoneNumber()).isEqualTo("+1 555-123-4567");
        assertThat(saved.getEmail()).isEqualTo("profile.update@novacore.test");
        assertThat(saved.getUsername()).isEqualTo("profileupdate");
        assertThat(saved.getPasswordHash()).startsWith("$2a$");
    }

    @Test
    void updateProfile_blankFirstName_returnsValidationError() throws Exception {
        AuthSession session = registerAndLogin("profile.invalid@novacore.test", "profileinvalid", "Secret123!");

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFirstName("");
        request.setLastName("User");

        mockMvc.perform(put("/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors", hasItem("firstName: must not be blank")));
    }

    @Test
    void updateProfile_invalidPhoneNumber_returnsValidationError() throws Exception {
        AuthSession session = registerAndLogin("profile.phone@novacore.test", "profilephone", "Secret123!");

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFirstName("Nova");
        request.setLastName("User");
        request.setPhoneNumber("abc");

        mockMvc.perform(put("/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors", hasItem("phoneNumber: must be a valid phone number")));
    }

    @Test
    void getCurrentProfile_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @Test
    void updateProfile_withoutAuthentication_returns401() throws Exception {
        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFirstName("Nova");
        request.setLastName("User");

        mockMvc.perform(put("/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    private AuthSession registerAndLogin(String email, String username, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail(email);
        registerRequest.setUsername(username);
        registerRequest.setPassword(password);
        registerRequest.setFirstName("Nova");
        registerRequest.setLastName("User");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmailOrUsername(username);
        loginRequest.setPassword(password);

        MvcResult loginResult = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();
        return new AuthSession(AuthCookieTestHelper.requireCookieValue(loginResult, AuthCookieTestHelper.ACCESS));
    }

    private record AuthSession(String accessToken) {
    }
}
