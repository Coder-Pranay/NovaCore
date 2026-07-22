package com.novacore.spaces;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.spaces.dto.CreateSpaceRequest;
import com.novacore.spaces.dto.UpdateSpaceRequest;
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
class SpaceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.novacore.auth.RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void cleanData() {
        spaceRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createSpace_success() throws Exception {
        AuthSession session = registerAndLogin("spaces.create@novacore.test", "spacecreator", "Secret123!");

        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName("Health");
        request.setDescription("Health records and appointments");
        request.setType(SpaceType.HEALTH);
        request.setColor("#4CAF50");

        mockMvc.perform(post("/v1/spaces")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Health"))
                .andExpect(jsonPath("$.data.slug").value("health"))
                .andExpect(jsonPath("$.data.type").value("HEALTH"))
                .andExpect(jsonPath("$.data.archived").value(false))
                .andExpect(jsonPath("$.data.ownerId").isNotEmpty());

        assertThat(spaceRepository.findAll()).hasSize(1);
        assertThat(spaceRepository.findAll().getFirst().getSlug()).isEqualTo("health");
    }

    @Test
    void listSpaces_returnsOwnedActiveSpaces() throws Exception {
        AuthSession session = registerAndLogin("spaces.list@novacore.test", "spacelist", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Travel", SpaceType.TRAVEL);

        mockMvc.perform(get("/v1/spaces")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("Travel"))
                .andExpect(jsonPath("$.data[0].type").value("TRAVEL"));

        mockMvc.perform(delete("/v1/spaces/" + spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/spaces")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void updateSpace_success() throws Exception {
        AuthSession session = registerAndLogin("spaces.update@novacore.test", "spaceupdate", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Finance", SpaceType.FINANCE);

        UpdateSpaceRequest request = new UpdateSpaceRequest();
        request.setName("Personal Finance");
        request.setDescription("Budgets and bills");
        request.setFavorite(true);
        request.setDisplayOrder(3);

        mockMvc.perform(put("/v1/spaces/" + spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Personal Finance"))
                .andExpect(jsonPath("$.data.description").value("Budgets and bills"))
                .andExpect(jsonPath("$.data.favorite").value(true))
                .andExpect(jsonPath("$.data.displayOrder").value(3))
                .andExpect(jsonPath("$.data.slug").value("finance"));

        var saved = spaceRepository.findById(java.util.UUID.fromString(spaceId)).orElseThrow();
        assertThat(saved.getName()).isEqualTo("Personal Finance");
        assertThat(saved.getSlug()).isEqualTo("finance");
        assertThat(saved.isFavorite()).isTrue();
    }

    @Test
    void archiveSpace_softDeletesSpace() throws Exception {
        AuthSession session = registerAndLogin("spaces.archive@novacore.test", "spacearchive", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Work", SpaceType.WORK);

        mockMvc.perform(delete("/v1/spaces/" + spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.archived").value(true));

        assertThat(spaceRepository.findById(java.util.UUID.fromString(spaceId)).orElseThrow().isArchived()).isTrue();
    }

    @Test
    void getSpaceById_otherUsersSpace_returns404() throws Exception {
        AuthSession owner = registerAndLogin("spaces.owner@novacore.test", "spaceowner", "Secret123!");
        AuthSession other = registerAndLogin("spaces.other@novacore.test", "spaceother", "Secret123!");
        String spaceId = createSpace(owner.accessToken(), "Home", SpaceType.HOME);

        mockMvc.perform(get("/v1/spaces/" + spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + other.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Space not found"));
    }

    @Test
    void createSpace_blankName_returnsValidationError() throws Exception {
        AuthSession session = registerAndLogin("spaces.invalid@novacore.test", "spaceinvalid", "Secret123!");

        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName("");

        mockMvc.perform(post("/v1/spaces")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors", hasItem("name: must not be blank")));
    }

    @Test
    void createSpace_withoutAuthentication_returns401() throws Exception {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName("Health");

        mockMvc.perform(post("/v1/spaces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    private String createSpace(String accessToken, String name, SpaceType type) throws Exception {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName(name);
        request.setType(type);

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
