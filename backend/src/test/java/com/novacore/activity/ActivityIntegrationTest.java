package com.novacore.activity;

import com.novacore.auth.AuthCookieTestHelper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.spaces.dto.CreateSpaceRequest;
import com.novacore.spaces.dto.UpdateSpaceRequest;
import com.novacore.storage.ObjectStorageService;
import com.novacore.users.dto.UpdateUserProfileRequest;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ActivityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private com.novacore.assets.AssetRepository assetRepository;

    @Autowired
    private com.novacore.spaces.SpaceRepository spaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.novacore.auth.RefreshTokenRepository refreshTokenRepository;

    @MockBean
    private ObjectStorageService objectStorageService;

    @BeforeEach
    void cleanData() {
        activityLogRepository.deleteAll();
        assetRepository.deleteAll();
        spaceRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getRecentActivity_returnsLatestActivitiesForAuthenticatedUser() throws Exception {
        AuthSession session = registerAndLogin("activity.user@novacore.test", "activityuser", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health");
        updateSpace(session.accessToken(), spaceId, "Health Records");

        mockMvc.perform(get("/v1/dashboard/activity")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Recent activity retrieved successfully"))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].entityType").value("SPACE"))
                .andExpect(jsonPath("$.data[0].action").value("UPDATED"))
                .andExpect(jsonPath("$.data[0].title").value("Updated Health Records Space"))
                .andExpect(jsonPath("$.data[1].entityType").value("SPACE"))
                .andExpect(jsonPath("$.data[1].action").value("CREATED"))
                .andExpect(jsonPath("$.data[1].title").value("Created Health Space"))
                .andExpect(jsonPath("$.data[0].metadata").doesNotExist());
    }

    @Test
    void getRecentActivity_withoutToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/v1/dashboard/activity"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getRecentActivity_doesNotExposeOtherUsersActivities() throws Exception {
        AuthSession userA = registerAndLogin("activity.a@novacore.test", "activitya", "Secret123!");
        createSpace(userA.accessToken(), "Private Space");

        AuthSession userB = registerAndLogin("activity.b@novacore.test", "activityb", "Secret123!");

        mockMvc.perform(get("/v1/dashboard/activity")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void getRecentActivity_emptyWhenNoActions() throws Exception {
        AuthSession session = registerAndLogin("activity.empty@novacore.test", "activityempty", "Secret123!");

        mockMvc.perform(get("/v1/dashboard/activity")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void automaticLogging_recordsSpaceAssetAndProfileActions() throws Exception {
        AuthSession session = registerAndLogin("activity.auto@novacore.test", "activityauto", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health");
        updateSpace(session.accessToken(), spaceId, "Health");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "Blood Report.pdf",
                "application/pdf",
                "sample-pdf-content".getBytes());

        MvcResult uploadResult = mockMvc.perform(multipart("/v1/assets/upload")
                        .file(file)
                        .param("spaceId", spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isCreated())
                .andReturn();

        String assetId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asText();

        mockMvc.perform(delete("/v1/assets/" + assetId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk());

        UpdateUserProfileRequest profileRequest = new UpdateUserProfileRequest();
        profileRequest.setFirstName("Updated");
        profileRequest.setLastName("User");
        profileRequest.setPhoneNumber("+15551234567");

        mockMvc.perform(put("/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/dashboard/activity")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(5)))
                .andExpect(jsonPath("$.data[0].entityType").value("PROFILE"))
                .andExpect(jsonPath("$.data[0].action").value("UPDATED"))
                .andExpect(jsonPath("$.data[0].title").value("Updated profile"))
                .andExpect(jsonPath("$.data[1].entityType").value("ASSET"))
                .andExpect(jsonPath("$.data[1].action").value("ARCHIVED"))
                .andExpect(jsonPath("$.data[2].entityType").value("ASSET"))
                .andExpect(jsonPath("$.data[2].action").value("UPLOADED"))
                .andExpect(jsonPath("$.data[2].title").value("Uploaded Blood Report.pdf"))
                .andExpect(jsonPath("$.data[2].description").value("Added to Health Space"))
                .andExpect(jsonPath("$.data[3].entityType").value("SPACE"))
                .andExpect(jsonPath("$.data[3].action").value("UPDATED"))
                .andExpect(jsonPath("$.data[4].entityType").value("SPACE"))
                .andExpect(jsonPath("$.data[4].action").value("CREATED"));
    }

    private void updateSpace(String accessToken, String spaceId, String name) throws Exception {
        UpdateSpaceRequest request = new UpdateSpaceRequest();
        request.setName(name);

        mockMvc.perform(put("/v1/spaces/" + spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private String createSpace(String accessToken, String name) throws Exception {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName(name);

        MvcResult result = mockMvc.perform(post("/v1/spaces")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asText();
    }

    private AuthSession registerAndLogin(String email, String username, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail(email);
        registerRequest.setUsername(username);
        registerRequest.setPassword(password);
        registerRequest.setFirstName("Nova");
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
        return new AuthSession(AuthCookieTestHelper.requireCookieValue(loginResult, AuthCookieTestHelper.ACCESS));
    }

    private record AuthSession(String accessToken) {
    }
}
