package com.novacore.sharing;

import com.novacore.assets.Asset;
import com.novacore.assets.AssetRepository;
import com.novacore.auth.PasswordService;
import com.novacore.common.exception.ResourceNotFoundException;
import com.novacore.sharing.dto.AccessPublicLinkRequest;
import com.novacore.sharing.dto.CreatePublicLinkRequest;
import com.novacore.sharing.dto.PublicLinkAccessResponse;
import com.novacore.sharing.dto.PublicLinkPreviewResponse;
import com.novacore.sharing.dto.PublicLinkResponse;
import com.novacore.sharing.exception.InvalidSharePasswordException;
import com.novacore.sharing.exception.PublicLinkNotFoundException;
import com.novacore.spaces.Space;
import com.novacore.spaces.SpaceRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.novacore.security.service.AuthenticatedUser;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicLinkServiceTest {

    @Mock
    private PublicLinkRepository publicLinkRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private AssetRepository assetRepository;

    private PasswordService passwordService;
    private PublicLinkService publicLinkService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID resourceId = UUID.randomUUID();
    private User owner;

    @BeforeEach
    void setUp() {
        passwordService = new PasswordService(new BCryptPasswordEncoder());
        publicLinkService = new PublicLinkService(
                publicLinkRepository,
                userRepository,
                spaceRepository,
                assetRepository,
                passwordService,
                "http://localhost:3000");

        owner = new User();
        owner.setId(ownerId);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new AuthenticatedUser(ownerId, "owner"),
                        null,
                        java.util.List.of()));
    }

    @Test
    void create_hashesPasswordAndNeverStoresPlaintext() {
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        stubOwnedSpace("Health");
        when(publicLinkRepository.save(any(PublicLink.class))).thenAnswer(invocation -> {
            PublicLink link = invocation.getArgument(0);
            link.setId(UUID.randomUUID());
            return link;
        });

        CreatePublicLinkRequest request = new CreatePublicLinkRequest();
        request.setResourceType(ShareResourceType.SPACE);
        request.setResourceId(resourceId);
        request.setResourceName("Client Spoofed Name");
        request.setPasswordProtected(true);
        request.setPassword("SharePass1!");

        PublicLinkResponse response = publicLinkService.create(request);

        ArgumentCaptor<PublicLink> captor = ArgumentCaptor.forClass(PublicLink.class);
        verify(publicLinkRepository).save(captor.capture());
        verify(publicLinkRepository).disableActiveLinksForResource(
                eq(ownerId), eq(ShareResourceType.SPACE), eq(resourceId));
        PublicLink saved = captor.getValue();

        assertThat(saved.getPasswordHash()).isNotBlank();
        assertThat(saved.getPasswordHash()).startsWith("$2");
        assertThat(saved.getPasswordHash()).isNotEqualTo("SharePass1!");
        assertThat(saved.getResourceName()).isEqualTo("Health");
        assertThat(response.isPasswordProtected()).isTrue();
        assertThat(response.getUrl()).contains("/shared/link/");
    }

    @Test
    void create_withoutPassword_storesNullHash() {
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        stubOwnedAsset("Doc");
        when(publicLinkRepository.save(any(PublicLink.class))).thenAnswer(invocation -> {
            PublicLink link = invocation.getArgument(0);
            link.setId(UUID.randomUUID());
            return link;
        });

        CreatePublicLinkRequest request = new CreatePublicLinkRequest();
        request.setResourceType(ShareResourceType.ASSET);
        request.setResourceId(resourceId);
        request.setResourceName("Doc");
        request.setPasswordProtected(false);

        PublicLinkResponse response = publicLinkService.create(request);

        ArgumentCaptor<PublicLink> captor = ArgumentCaptor.forClass(PublicLink.class);
        verify(publicLinkRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isNull();
        assertThat(response.isPasswordProtected()).isFalse();
    }

    @Test
    void create_passwordProtectedWithoutPassword_rejects() {
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        stubOwnedSpace("Health");

        CreatePublicLinkRequest request = new CreatePublicLinkRequest();
        request.setResourceType(ShareResourceType.SPACE);
        request.setResourceId(resourceId);
        request.setResourceName("Health");
        request.setPasswordProtected(true);

        assertThatThrownBy(() -> publicLinkService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Password is required");
        verify(publicLinkRepository, never()).save(any());
    }

    @Test
    void create_rejectsWhenResourceNotOwned() {
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.findByIdAndOwnerId(resourceId, ownerId)).thenReturn(Optional.empty());

        CreatePublicLinkRequest request = new CreatePublicLinkRequest();
        request.setResourceType(ShareResourceType.SPACE);
        request.setResourceId(resourceId);
        request.setResourceName("Stolen");
        request.setPasswordProtected(false);

        assertThatThrownBy(() -> publicLinkService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Resource not found");
        verify(publicLinkRepository, never()).save(any());
        verify(publicLinkRepository, never()).disableActiveLinksForResource(any(), any(), any());
    }

    @Test
    void access_withCorrectPassword_returnsContent() {
        PublicLink link = protectedLink("CorrectPass1!");
        when(publicLinkRepository.findByToken(link.getToken())).thenReturn(Optional.of(link));

        AccessPublicLinkRequest request = new AccessPublicLinkRequest();
        request.setPassword("CorrectPass1!");

        PublicLinkAccessResponse response = publicLinkService.access(link.getToken(), request);

        assertThat(response.getResourceId()).isEqualTo(resourceId);
        assertThat(response.getResourceName()).isEqualTo("Health");
    }

    @Test
    void access_withWrongPassword_returns401Semantics() {
        PublicLink link = protectedLink("CorrectPass1!");
        when(publicLinkRepository.findByToken(link.getToken())).thenReturn(Optional.of(link));

        AccessPublicLinkRequest request = new AccessPublicLinkRequest();
        request.setPassword("WrongPass99!");

        assertThatThrownBy(() -> publicLinkService.access(link.getToken(), request))
                .isInstanceOf(InvalidSharePasswordException.class)
                .hasMessage("Invalid password");
    }

    @Test
    void access_missingPasswordOnProtectedLink_returns401Semantics() {
        PublicLink link = protectedLink("CorrectPass1!");
        when(publicLinkRepository.findByToken(link.getToken())).thenReturn(Optional.of(link));

        assertThatThrownBy(() -> publicLinkService.access(link.getToken(), new AccessPublicLinkRequest()))
                .isInstanceOf(InvalidSharePasswordException.class);
    }

    @Test
    void access_unknownToken_returns404Semantics() {
        when(publicLinkRepository.findByToken("missing")).thenReturn(Optional.empty());

        AccessPublicLinkRequest request = new AccessPublicLinkRequest();
        request.setPassword("anything1");

        assertThatThrownBy(() -> publicLinkService.access("missing", request))
                .isInstanceOf(PublicLinkNotFoundException.class)
                .hasMessage("Share not found");
    }

    @Test
    void preview_doesNotExposeResourceId() {
        PublicLink link = protectedLink("CorrectPass1!");
        when(publicLinkRepository.findByToken(link.getToken())).thenReturn(Optional.of(link));

        PublicLinkPreviewResponse preview = publicLinkService.preview(link.getToken());

        assertThat(preview.isPasswordRequired()).isTrue();
        assertThat(preview.getResourceName()).isEqualTo("Health");
        assertThat(preview.getToken()).isEqualTo(link.getToken());
    }

    @Test
    void access_unprotectedLink_returnsContentWithoutPassword() {
        PublicLink link = new PublicLink();
        link.setId(UUID.randomUUID());
        link.setOwner(owner);
        link.setResourceType(ShareResourceType.SPACE);
        link.setResourceId(resourceId);
        link.setResourceName("Open");
        link.setToken("opentoken");
        link.setPasswordHash(null);
        link.setEnabled(true);
        when(publicLinkRepository.findByToken("opentoken")).thenReturn(Optional.of(link));

        PublicLinkAccessResponse response =
                publicLinkService.access("opentoken", new AccessPublicLinkRequest());

        assertThat(response.getResourceName()).isEqualTo("Open");
    }

    @Test
    void access_disabledLink_returns404() {
        PublicLink link = protectedLink("CorrectPass1!");
        link.setEnabled(false);
        when(publicLinkRepository.findByToken(link.getToken())).thenReturn(Optional.of(link));

        AccessPublicLinkRequest request = new AccessPublicLinkRequest();
        request.setPassword("CorrectPass1!");

        assertThatThrownBy(() -> publicLinkService.access(link.getToken(), request))
                .isInstanceOf(PublicLinkNotFoundException.class);
    }

    @Test
    void access_expiredLink_returns404() {
        PublicLink link = protectedLink("CorrectPass1!");
        link.setExpiresAt(Instant.now().minusSeconds(60));
        when(publicLinkRepository.findByToken(link.getToken())).thenReturn(Optional.of(link));

        AccessPublicLinkRequest request = new AccessPublicLinkRequest();
        request.setPassword("CorrectPass1!");

        assertThatThrownBy(() -> publicLinkService.access(link.getToken(), request))
                .isInstanceOf(PublicLinkNotFoundException.class);
    }

    private void stubOwnedSpace(String name) {
        Space space = new Space();
        space.setId(resourceId);
        space.setName(name);
        when(spaceRepository.findByIdAndOwnerId(resourceId, ownerId)).thenReturn(Optional.of(space));
    }

    private void stubOwnedAsset(String name) {
        Asset asset = new Asset();
        asset.setId(resourceId);
        asset.setName(name);
        when(assetRepository.findByIdAndOwnerId(resourceId, ownerId)).thenReturn(Optional.of(asset));
    }

    private PublicLink protectedLink(String rawPassword) {
        PublicLink link = new PublicLink();
        link.setId(UUID.randomUUID());
        link.setOwner(owner);
        link.setResourceType(ShareResourceType.SPACE);
        link.setResourceId(resourceId);
        link.setResourceName("Health");
        link.setToken("tok-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        link.setPasswordHash(passwordService.hashPassword(rawPassword));
        link.setEnabled(true);
        return link;
    }
}
