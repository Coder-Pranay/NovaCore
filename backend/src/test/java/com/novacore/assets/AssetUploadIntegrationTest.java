package com.novacore.assets;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AssetUploadIntegrationTest {

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
    void uploadAsset_success_persistsMetadata() throws Exception {
        AuthSession session = registerAndLogin("upload.ok@novacore.test", "uploadok", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "report.pdf",
                "application/pdf",
                "sample-pdf-content".getBytes());

        mockMvc.perform(multipart("/v1/assets/upload")
                        .file(file)
                        .param("spaceId", spaceId)
                        .param("description", "Annual checkup")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("File uploaded successfully"))
                .andExpect(jsonPath("$.data.name").value("report.pdf"))
                .andExpect(jsonPath("$.data.assetType").value("PDF"))
                .andExpect(jsonPath("$.data.mimeType").value("application/pdf"))
                .andExpect(jsonPath("$.data.originalFilename").value("report.pdf"))
                .andExpect(jsonPath("$.data.extension").value("pdf"))
                .andExpect(jsonPath("$.data.description").value("Annual checkup"))
                .andExpect(jsonPath("$.data.storageKey").doesNotExist());

        Asset saved = assetRepository.findAll().getFirst();
        assertThat(saved.getStorageKey()).contains("/spaces/" + spaceId + "/").endsWith("-report.pdf");
        assertThat(saved.getFileSize()).isEqualTo(file.getSize());
        assertThat(saved.getMimeType()).isEqualTo("application/pdf");

        verify(objectStorageService).upload(
                eq(saved.getStorageKey()),
                any(),
                eq(file.getSize()),
                eq("application/pdf"));
    }

    @Test
    void uploadAsset_emptyFile_returns400() throws Exception {
        AuthSession session = registerAndLogin("upload.empty@novacore.test", "uploadempty", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health");

        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        mockMvc.perform(multipart("/v1/assets/upload")
                        .file(file)
                        .param("spaceId", spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("File must not be empty"));

        verify(objectStorageService, never()).upload(anyString(), any(), anyLong(), anyString());
        assertThat(assetRepository.findAll()).isEmpty();
    }

    @Test
    void uploadAsset_invalidSpace_returns404() throws Exception {
        AuthSession session = registerAndLogin("upload.invalid@novacore.test", "uploadinvalid", "Secret123!");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "report.pdf",
                "application/pdf",
                "sample".getBytes());

        mockMvc.perform(multipart("/v1/assets/upload")
                        .file(file)
                        .param("spaceId", UUID.randomUUID().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Space not found"));
    }

    @Test
    void uploadAsset_otherUsersSpace_returns404() throws Exception {
        AuthSession owner = registerAndLogin("upload.owner@novacore.test", "uploadowner", "Secret123!");
        AuthSession other = registerAndLogin("upload.other@novacore.test", "uploadother", "Secret123!");
        String ownerSpaceId = createSpace(owner.accessToken(), "Private");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "secret.pdf",
                "application/pdf",
                "secret".getBytes());

        mockMvc.perform(multipart("/v1/assets/upload")
                        .file(file)
                        .param("spaceId", ownerSpaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + other.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Space not found"));

        assertThat(assetRepository.findAll()).isEmpty();
    }

    @Test
    void uploadAsset_storageFailure_returns500() throws Exception {
        AuthSession session = registerAndLogin("upload.fail@novacore.test", "uploadfail", "Secret123!");
        String spaceId = createSpace(session.accessToken(), "Health");

        doThrow(new RuntimeException("MinIO unavailable"))
                .when(objectStorageService)
                .upload(anyString(), any(), anyLong(), anyString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "report.pdf",
                "application/pdf",
                "sample".getBytes());

        mockMvc.perform(multipart("/v1/assets/upload")
                        .file(file)
                        .param("spaceId", spaceId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Failed to upload file to storage"));

        assertThat(assetRepository.findAll()).isEmpty();
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
