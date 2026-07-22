package com.novacore.dashboard;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.assets.AssetType;
import com.novacore.assets.dto.CreateAssetRequest;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.spaces.dto.CreateSpaceRequest;
import com.novacore.spaces.dto.UpdateSpaceRequest;
import com.novacore.storage.ObjectStorageService;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
        assetRepository.deleteAll();
        spaceRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void getDashboard_returnsAuthenticatedUserSummary() throws Exception {
        AuthSession session = registerAndLogin("dashboard.user@novacore.test", "dashboarduser", "Secret123!");
        String healthSpaceId = createSpace(session.accessToken(), "Health");
        markSpaceFavorite(session.accessToken(), healthSpaceId);
        createSpace(session.accessToken(), "Travel");

        createAsset(session.accessToken(), healthSpaceId, "Scan.pdf", AssetType.PDF, 1024L);
        createAsset(session.accessToken(), healthSpaceId, "Photo.jpg", AssetType.IMAGE, 2048L);
        createAsset(session.accessToken(), healthSpaceId, "Clip.mp4", AssetType.VIDEO, 4096L);
        createAsset(session.accessToken(), healthSpaceId, "Note.txt", AssetType.NOTE, null);
        createAsset(session.accessToken(), healthSpaceId, "Bookmark", AssetType.LINK, null);

        mockMvc.perform(get("/v1/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Dashboard retrieved successfully"))
                .andExpect(jsonPath("$.data.user.firstName").value("Nova"))
                .andExpect(jsonPath("$.data.spaces.totalSpaces").value(2))
                .andExpect(jsonPath("$.data.spaces.favoriteSpaces").value(1))
                .andExpect(jsonPath("$.data.assets.totalAssets").value(5))
                .andExpect(jsonPath("$.data.assets.recentUploads", hasSize(5)))
                .andExpect(jsonPath("$.data.assets.recentUploads[0].spaceName").exists())
                .andExpect(jsonPath("$.data.storage.totalFileCount").value(3))
                .andExpect(jsonPath("$.data.storage.totalBytesUsed").value(7168))
                .andExpect(jsonPath("$.data.storage.formattedSize").value("7.00 KB"))
                .andExpect(jsonPath("$.data.statistics.images").value(1))
                .andExpect(jsonPath("$.data.statistics.documents").value(1))
                .andExpect(jsonPath("$.data.statistics.videos").value(1))
                .andExpect(jsonPath("$.data.statistics.notes").value(1))
                .andExpect(jsonPath("$.data.statistics.links").value(1))
                .andExpect(jsonPath("$.data.assets.recentUploads[0].storageKey").doesNotExist())
                .andExpect(jsonPath("$.data.storageKey").doesNotExist());
    }

    @Test
    void getDashboard_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/v1/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @Test
    void getDashboard_limitsRecentUploadsToTen() throws Exception {
        AuthSession session = registerAndLogin("dashboard.limit@novacore.test", "dashboardlimit", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Archive");

        for (int i = 1; i <= 12; i++) {
            createAsset(session.accessToken(), spaceId, "File-" + i, AssetType.FILE, (long) i);
        }

        mockMvc.perform(get("/v1/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assets.totalAssets").value(12))
                .andExpect(jsonPath("$.data.assets.recentUploads", hasSize(10)));
    }

    private void markSpaceFavorite(String accessToken, String spaceId) throws Exception {
        UpdateSpaceRequest request = new UpdateSpaceRequest();
        request.setName("Health");
        request.setFavorite(true);

        mockMvc.perform(put("/v1/spaces/" + spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private void createAsset(
            String accessToken,
            String spaceId,
            String name,
            AssetType type,
            Long fileSize) throws Exception {
        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(UUID.fromString(spaceId));
        request.setName(name);
        request.setAssetType(type);
        request.setFileSize(fileSize);

        mockMvc.perform(post("/v1/assets")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
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

        JsonNode data = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("data");
        return new AuthSession(data.get("accessToken").asText());
    }

    private record AuthSession(String accessToken) {
    }
}
