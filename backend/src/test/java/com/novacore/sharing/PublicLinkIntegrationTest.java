package com.novacore.sharing;

import com.novacore.auth.AuthCookieTestHelper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacore.auth.RefreshTokenRepository;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.sharing.dto.AccessPublicLinkRequest;
import com.novacore.sharing.dto.CreatePublicLinkRequest;
import com.novacore.spaces.SpaceRepository;
import com.novacore.spaces.SpaceType;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicLinkIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PublicLinkRepository publicLinkRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void cleanData() {
        publicLinkRepository.deleteAll();
        spaceRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createProtectedLink_storesBcryptHashOnly() throws Exception {
        AuthSession session = registerAndLogin("share.create@novacore.test", "sharecreate", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Shared Space");

        CreatePublicLinkRequest request = new CreatePublicLinkRequest();
        request.setResourceType(ShareResourceType.SPACE);
        request.setResourceId(UUID.fromString(spaceId));
        request.setResourceName("Shared Space");
        request.setPasswordProtected(true);
        request.setPassword("LinkPass12!");

        MvcResult result = mockMvc.perform(post("/v1/public-links")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.passwordProtected").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andReturn();

        String token = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data")
                .get("token")
                .asText();

        PublicLink stored = publicLinkRepository.findByToken(token).orElseThrow();
        assertThat(stored.getPasswordHash()).startsWith("$2");
        assertThat(stored.getPasswordHash()).doesNotContain("LinkPass12!");
    }

    @Test
    void access_wrongPassword_returns401() throws Exception {
        AuthSession session = registerAndLogin("share.wrong@novacore.test", "sharewrong", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Locked");
        String token = createProtectedLink(session.accessToken(), spaceId, "Locked", "GoodPass12!");

        AccessPublicLinkRequest access = new AccessPublicLinkRequest();
        access.setPassword("BadPass999!");

        mockMvc.perform(post("/v1/public-links/open/" + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(access)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid password"));
    }

    @Test
    void access_unknownToken_returns404() throws Exception {
        AccessPublicLinkRequest access = new AccessPublicLinkRequest();
        access.setPassword("Whatever1!");

        mockMvc.perform(post("/v1/public-links/open/does-not-exist-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(access)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Share not found"));
    }

    @Test
    void access_correctPassword_returnsContent_withoutAuth() throws Exception {
        AuthSession session = registerAndLogin("share.ok@novacore.test", "shareok", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Openable");
        String token = createProtectedLink(session.accessToken(), spaceId, "Openable", "GoodPass12!");

        AccessPublicLinkRequest access = new AccessPublicLinkRequest();
        access.setPassword("GoodPass12!");

        mockMvc.perform(post("/v1/public-links/open/" + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(access)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.resourceName").value("Openable"))
                .andExpect(jsonPath("$.data.resourceId").value(spaceId));
    }

    @Test
    void preview_protectedLink_doesNotReturnContent() throws Exception {
        AuthSession session = registerAndLogin("share.prev@novacore.test", "shareprev", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Preview");
        String token = createProtectedLink(session.accessToken(), spaceId, "Preview", "GoodPass12!");

        mockMvc.perform(get("/v1/public-links/open/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.passwordRequired").value(true))
                .andExpect(jsonPath("$.data.resourceName").value("Preview"))
                .andExpect(jsonPath("$.data.resourceId").doesNotExist());
    }

    @Test
    void preview_get_cannotBypassPasswordGate() throws Exception {
        AuthSession session = registerAndLogin("share.bypass@novacore.test", "sharebypass", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "NoBypass");
        String token = createProtectedLink(session.accessToken(), spaceId, "NoBypass", "GoodPass12!");

        mockMvc.perform(get("/v1/public-links/open/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.resourceId").doesNotExist());

        mockMvc.perform(post("/v1/public-links/open/" + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void disable_thenAccess_returns404() throws Exception {
        AuthSession session = registerAndLogin("share.off@novacore.test", "shareoff", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Disabled");

        CreatePublicLinkRequest request = new CreatePublicLinkRequest();
        request.setResourceType(ShareResourceType.SPACE);
        request.setResourceId(UUID.fromString(spaceId));
        request.setResourceName("Disabled");
        request.setPasswordProtected(true);
        request.setPassword("GoodPass12!");

        MvcResult createResult = mockMvc.perform(post("/v1/public-links")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode data = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data");
        String linkId = data.get("id").asText();
        String token = data.get("token").asText();

        mockMvc.perform(delete("/v1/public-links/" + linkId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.enabled").value(false));

        AccessPublicLinkRequest access = new AccessPublicLinkRequest();
        access.setPassword("GoodPass12!");

        mockMvc.perform(post("/v1/public-links/open/" + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(access)))
                .andExpect(status().isNotFound());
    }

    private String createProtectedLink(
            String accessToken,
            String spaceId,
            String name,
            String password) throws Exception {
        CreatePublicLinkRequest request = new CreatePublicLinkRequest();
        request.setResourceType(ShareResourceType.SPACE);
        request.setResourceId(UUID.fromString(spaceId));
        request.setResourceName(name);
        request.setPasswordProtected(true);
        request.setPassword(password);

        MvcResult result = mockMvc.perform(post("/v1/public-links")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data")
                .get("token")
                .asText();
    }

    private String createSpace(String accessToken, String name) throws Exception {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName(name);
        request.setType(SpaceType.BLANK);

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
        registerRequest.setFirstName("Share");
        registerRequest.setLastName("Tester");

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
