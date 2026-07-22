package com.novacore.search;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.assets.AssetType;
import com.novacore.assets.dto.CreateAssetRequest;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.spaces.dto.CreateSpaceRequest;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SearchIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.novacore.activity.ActivityLogRepository activityLogRepository;

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
    void search_returnsMatchingSpaces() throws Exception {
        AuthSession session = registerAndLogin("search.spaces@novacore.test", "searchspaces", "Secret123!");
        createSpace(session.accessToken(), "Health", "Medical records");
        createSpace(session.accessToken(), "Travel", "Trip planning");

        mockMvc.perform(get("/v1/search")
                        .param("q", "health")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Search completed successfully"))
                .andExpect(jsonPath("$.data.query").value("health"))
                .andExpect(jsonPath("$.data.spaces", hasSize(1)))
                .andExpect(jsonPath("$.data.spaces[0].name").value("Health"))
                .andExpect(jsonPath("$.data.spaces[0].description").value("Medical records"))
                .andExpect(jsonPath("$.data.totalSpaces").value(1))
                .andExpect(jsonPath("$.data.assets", hasSize(0)))
                .andExpect(jsonPath("$.data.totalAssets").value(0))
                .andExpect(jsonPath("$.data.spaces[0].slug").doesNotExist());
    }

    @Test
    void search_returnsMatchingAssetsWithSpaceInfo() throws Exception {
        AuthSession session = registerAndLogin("search.assets@novacore.test", "searchassets", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health", "Medical records");
        createAsset(session.accessToken(), spaceId, "Blood Report.pdf", "Annual checkup", AssetType.PDF);

        mockMvc.perform(get("/v1/search")
                        .param("q", "report")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assets", hasSize(1)))
                .andExpect(jsonPath("$.data.assets[0].name").value("Blood Report.pdf"))
                .andExpect(jsonPath("$.data.assets[0].description").value("Annual checkup"))
                .andExpect(jsonPath("$.data.assets[0].assetType").value("PDF"))
                .andExpect(jsonPath("$.data.assets[0].spaceName").value("Health"))
                .andExpect(jsonPath("$.data.totalAssets").value(1))
                .andExpect(jsonPath("$.data.assets[0].storageKey").doesNotExist());
    }

    @Test
    void search_returnsSpacesAndAssetsTogether() throws Exception {
        AuthSession session = registerAndLogin("search.both@novacore.test", "searchboth", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health Hub", "Wellness");
        createAsset(session.accessToken(), spaceId, "Health Checklist", "Tasks", AssetType.NOTE);

        mockMvc.perform(get("/v1/search")
                        .param("q", "health")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.spaces", hasSize(1)))
                .andExpect(jsonPath("$.data.assets", hasSize(1)))
                .andExpect(jsonPath("$.data.totalSpaces").value(1))
                .andExpect(jsonPath("$.data.totalAssets").value(1));
    }

    @Test
    void search_returnsEmptyResultsWhenNothingMatches() throws Exception {
        AuthSession session = registerAndLogin("search.empty@novacore.test", "searchempty", "Secret123!");
        createSpace(session.accessToken(), "Travel", "Trips");

        mockMvc.perform(get("/v1/search")
                        .param("q", "health")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.spaces", hasSize(0)))
                .andExpect(jsonPath("$.data.assets", hasSize(0)))
                .andExpect(jsonPath("$.data.totalSpaces").value(0))
                .andExpect(jsonPath("$.data.totalAssets").value(0));
    }

    @Test
    void search_withoutToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/v1/search").param("q", "health"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void search_doesNotExposeOtherUsersData() throws Exception {
        AuthSession userA = registerAndLogin("search.a@novacore.test", "searcha", "Secret123!");
        createSpace(userA.accessToken(), "Private Health", "Secret records");

        AuthSession userB = registerAndLogin("search.b@novacore.test", "searchb", "Secret123!");

        mockMvc.perform(get("/v1/search")
                        .param("q", "health")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.spaces", hasSize(0)))
                .andExpect(jsonPath("$.data.assets", hasSize(0)));
    }

    @Test
    void search_excludesArchivedRecords() throws Exception {
        AuthSession session = registerAndLogin("search.archived@novacore.test", "searcharchived", "Secret123!");
        String activeSpaceId = createSpace(session.accessToken(), "Active Health", "Visible");
        String archivedSpaceId = createSpace(session.accessToken(), "Archived Health", "Hidden");
        archiveSpace(session.accessToken(), archivedSpaceId);
        createAsset(session.accessToken(), activeSpaceId, "Active Health Report", null, AssetType.PDF);
        String archivedAssetId = createAssetAndReturnId(
                session.accessToken(), activeSpaceId, "Archived Health Report", null, AssetType.PDF);
        archiveAsset(session.accessToken(), archivedAssetId);

        mockMvc.perform(get("/v1/search")
                        .param("q", "health")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.spaces", hasSize(1)))
                .andExpect(jsonPath("$.data.spaces[0].name").value("Active Health"))
                .andExpect(jsonPath("$.data.assets", hasSize(1)))
                .andExpect(jsonPath("$.data.assets[0].name").value("Active Health Report"));
    }

    @Test
    void search_rejectsBlankQuery() throws Exception {
        AuthSession session = registerAndLogin("search.blank@novacore.test", "searchblank", "Secret123!");

        mockMvc.perform(get("/v1/search")
                        .param("q", "   ")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Search query must not be blank"));
    }

    @Test
    void search_supportsPagination() throws Exception {
        AuthSession session = registerAndLogin("search.page@novacore.test", "searchpage", "Secret123!");
        createSpace(session.accessToken(), "Alpha Health", null);
        createSpace(session.accessToken(), "Beta Health", null);
        createSpace(session.accessToken(), "Gamma Health", null);

        mockMvc.perform(get("/v1/search")
                        .param("q", "health")
                        .param("page", "0")
                        .param("size", "2")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.spaces", hasSize(2)))
                .andExpect(jsonPath("$.data.totalSpaces").value(3))
                .andExpect(jsonPath("$.data.spaces[0].name").value("Alpha Health"))
                .andExpect(jsonPath("$.data.spaces[1].name").value("Beta Health"));
    }

    private void archiveSpace(String accessToken, String spaceId) throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/v1/spaces/" + spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    private void archiveAsset(String accessToken, String assetId) throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/v1/assets/" + assetId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    private String createSpace(String accessToken, String name, String description) throws Exception {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName(name);
        request.setDescription(description);

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

    private void createAsset(
            String accessToken,
            String spaceId,
            String name,
            String description,
            AssetType assetType) throws Exception {
        createAssetAndReturnId(accessToken, spaceId, name, description, assetType);
    }

    private String createAssetAndReturnId(
            String accessToken,
            String spaceId,
            String name,
            String description,
            AssetType assetType) throws Exception {
        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(UUID.fromString(spaceId));
        request.setName(name);
        request.setDescription(description);
        request.setAssetType(assetType);

        MvcResult result = mockMvc.perform(post("/v1/assets")
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
