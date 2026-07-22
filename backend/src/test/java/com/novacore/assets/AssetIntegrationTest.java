package com.novacore.assets;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.assets.dto.CreateAssetRequest;
import com.novacore.assets.dto.UpdateAssetRequest;
import com.novacore.spaces.dto.CreateSpaceRequest;
import com.novacore.users.UserRepository;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AssetIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private com.novacore.spaces.SpaceRepository spaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.novacore.auth.RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void cleanData() {
        assetRepository.deleteAll();
        spaceRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createAsset_success() throws Exception {
        AuthSession session = registerAndLogin("assets.create@novacore.test", "assetcreator", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health");

        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(UUID.fromString(spaceId));
        request.setName("Blood Test Report");
        request.setDescription("Annual checkup results");
        request.setAssetType(AssetType.PDF);
        request.setMimeType("application/pdf");
        request.setOriginalFilename("report.pdf");
        request.setExtension("pdf");

        mockMvc.perform(post("/v1/assets")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Blood Test Report"))
                .andExpect(jsonPath("$.data.assetType").value("PDF"))
                .andExpect(jsonPath("$.data.spaceId").value(spaceId))
                .andExpect(jsonPath("$.data.storageKey").doesNotExist())
                .andExpect(jsonPath("$.data.archived").value(false));

        assertThat(assetRepository.findAll()).hasSize(1);
        assertThat(assetRepository.findAll().getFirst().getStorageKey()).isNull();
    }

    @Test
    void listAssets_returnsOwnedActiveAssets() throws Exception {
        AuthSession session = registerAndLogin("assets.list@novacore.test", "assetlist", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Travel");
        String assetId = createAsset(session.accessToken(), spaceId, "Flight Ticket", AssetType.DOCUMENT);

        mockMvc.perform(get("/v1/assets")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("Flight Ticket"));

        mockMvc.perform(get("/v1/assets")
                        .param("spaceId", spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));

        mockMvc.perform(delete("/v1/assets/" + assetId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/assets")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void updateAsset_success() throws Exception {
        AuthSession session = registerAndLogin("assets.update@novacore.test", "assetupdate", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Work");
        String assetId = createAsset(session.accessToken(), spaceId, "Meeting Notes", AssetType.NOTE);

        UpdateAssetRequest request = new UpdateAssetRequest();
        request.setName("Sprint Planning Notes");
        request.setDescription("Q3 planning session");
        request.setFavorite(true);

        mockMvc.perform(put("/v1/assets/" + assetId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Sprint Planning Notes"))
                .andExpect(jsonPath("$.data.description").value("Q3 planning session"))
                .andExpect(jsonPath("$.data.favorite").value(true));

        var saved = assetRepository.findById(UUID.fromString(assetId)).orElseThrow();
        assertThat(saved.getName()).isEqualTo("Sprint Planning Notes");
        assertThat(saved.isFavorite()).isTrue();
    }

    @Test
    void archiveAsset_softDeletesAsset() throws Exception {
        AuthSession session = registerAndLogin("assets.archive@novacore.test", "assetarchive", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Finance");
        String assetId = createAsset(session.accessToken(), spaceId, "Receipt", AssetType.DOCUMENT);

        mockMvc.perform(delete("/v1/assets/" + assetId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.archived").value(true));

        assertThat(assetRepository.findById(UUID.fromString(assetId)).orElseThrow().isArchived()).isTrue();
    }

    @Test
    void createAsset_inAnotherUsersSpace_returns404() throws Exception {
        AuthSession owner = registerAndLogin("assets.owner@novacore.test", "assetowner", "Secret123!");
        AuthSession other = registerAndLogin("assets.other@novacore.test", "assetother", "Secret123!");
        String ownerSpaceId = createSpace(owner.accessToken(), "Home");

        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(UUID.fromString(ownerSpaceId));
        request.setName("Private Doc");
        request.setAssetType(AssetType.DOCUMENT);

        mockMvc.perform(post("/v1/assets")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + other.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Space not found"));

        assertThat(assetRepository.findAll()).isEmpty();
    }

    @Test
    void getAsset_otherUsersAsset_returns404() throws Exception {
        AuthSession owner = registerAndLogin("assets.getowner@novacore.test", "getowner", "Secret123!");
        AuthSession other = registerAndLogin("assets.getother@novacore.test", "getother", "Secret123!");
        String spaceId = createSpace(owner.accessToken(), "Personal");
        String assetId = createAsset(owner.accessToken(), spaceId, "Private Note", AssetType.NOTE);

        mockMvc.perform(get("/v1/assets/" + assetId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + other.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Asset not found"));
    }

    @Test
    void createAsset_blankName_returnsValidationError() throws Exception {
        AuthSession session = registerAndLogin("assets.invalid@novacore.test", "assetinvalid", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health");

        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(UUID.fromString(spaceId));
        request.setName("");
        request.setAssetType(AssetType.NOTE);

        mockMvc.perform(post("/v1/assets")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors", hasItem("name: must not be blank")));
    }

    @Test
    void createAsset_withoutAuthentication_returns401() throws Exception {
        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(UUID.randomUUID());
        request.setName("Note");
        request.setAssetType(AssetType.NOTE);

        mockMvc.perform(post("/v1/assets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
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

    private String createAsset(String accessToken, String spaceId, String name, AssetType type) throws Exception {
        CreateAssetRequest request = new CreateAssetRequest();
        request.setSpaceId(UUID.fromString(spaceId));
        request.setName(name);
        request.setAssetType(type);

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
