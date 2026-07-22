package com.novacore.spaces;

import com.novacore.activity.ActivityLogService;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.common.exception.ConflictException;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.spaces.dto.CreateSpaceRequest;
import com.novacore.spaces.dto.SpaceResponse;
import com.novacore.spaces.dto.UpdateSpaceRequest;
import com.novacore.spaces.exception.SpaceNotFoundException;
import com.novacore.spaces.mapper.SpaceMapper;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpaceServiceTest {

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SpaceMapper spaceMapper;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private SpaceService spaceService;

    private UUID ownerId;
    private User owner;
    private Space space;
    private SpaceResponse spaceResponse;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ownerId = UUID.randomUUID();

        owner = new User();
        owner.setId(ownerId);
        owner.setUsername("alice");
        owner.setEmail("alice@example.com");

        space = new Space();
        space.setId(UUID.randomUUID());
        space.setOwner(owner);
        space.setName("Health");
        space.setSlug("health");
        space.setType(SpaceType.HEALTH);
        space.setDisplayOrder(0);
        space.setCreatedAt(Instant.now());
        space.setUpdatedAt(Instant.now());

        spaceResponse = new SpaceResponse();
        spaceResponse.setId(space.getId());
        spaceResponse.setOwnerId(ownerId);
        spaceResponse.setName("Health");
        spaceResponse.setSlug("health");
        spaceResponse.setType(SpaceType.HEALTH);

        authenticateAs(ownerId, "alice");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createSpace_success() {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName("Health");
        request.setType(SpaceType.HEALTH);

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.existsByOwnerIdAndSlug(ownerId, "health")).thenReturn(false);
        when(spaceRepository.countByOwnerId(ownerId)).thenReturn(0);
        when(spaceRepository.save(any(Space.class))).thenAnswer(invocation -> {
            Space saved = invocation.getArgument(0);
            saved.setId(space.getId());
            return saved;
        });
        when(spaceMapper.toResponse(any(Space.class))).thenReturn(spaceResponse);

        SpaceResponse result = spaceService.createSpace(request);

        assertThat(result.getName()).isEqualTo("Health");
        verify(spaceRepository).save(any(Space.class));
    }

    @Test
    void createSpace_duplicateSlug_throwsConflict() {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName("Health");
        request.setSlug("health");

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(spaceRepository.existsByOwnerIdAndSlug(ownerId, "health")).thenReturn(true);

        assertThatThrownBy(() -> spaceService.createSpace(request))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Slug already in use");
    }

    @Test
    void getMySpaces_returnsOnlyActiveSpaces() {
        Space archived = new Space();
        archived.setId(UUID.randomUUID());
        archived.setOwner(owner);
        archived.setName("Old");
        archived.setSlug("old");
        archived.setArchived(true);

        when(spaceRepository.findAllByOwnerIdAndArchivedFalseOrderByDisplayOrderAsc(ownerId))
                .thenReturn(List.of(space));
        when(spaceMapper.toResponse(space)).thenReturn(spaceResponse);

        List<SpaceResponse> result = spaceService.getMySpaces();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getName()).isEqualTo("Health");
    }

    @Test
    void getSpaceById_notOwned_throwsNotFound() {
        UUID otherSpaceId = UUID.randomUUID();
        when(spaceRepository.findByIdAndOwnerId(otherSpaceId, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> spaceService.getSpaceById(otherSpaceId))
                .isInstanceOf(SpaceNotFoundException.class);
    }

    @Test
    void updateSpace_success() {
        UpdateSpaceRequest request = new UpdateSpaceRequest();
        request.setName("Wellness");
        request.setDescription("Health tracking");
        request.setFavorite(true);

        when(spaceRepository.findByIdAndOwnerId(space.getId(), ownerId)).thenReturn(Optional.of(space));
        when(spaceRepository.save(space)).thenReturn(space);
        when(spaceMapper.toResponse(space)).thenReturn(spaceResponse);

        spaceService.updateSpace(space.getId(), request);

        assertThat(space.getName()).isEqualTo("Wellness");
        assertThat(space.getDescription()).isEqualTo("Health tracking");
        assertThat(space.isFavorite()).isTrue();
        verify(spaceRepository).save(space);
    }

    @Test
    void archiveSpace_marksArchived() {
        when(spaceRepository.findByIdAndOwnerId(space.getId(), ownerId)).thenReturn(Optional.of(space));
        when(spaceRepository.save(space)).thenReturn(space);
        when(spaceMapper.toResponse(space)).thenReturn(spaceResponse);

        spaceService.archiveSpace(space.getId());

        assertThat(space.isArchived()).isTrue();
        verify(spaceRepository).save(space);
    }

    @Test
    void createSpace_withoutAuthentication_throwsUnauthorized() {
        SecurityContextHolder.clearContext();

        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setName("Health");

        assertThatThrownBy(() -> spaceService.createSpace(request))
                .isInstanceOf(AuthenticationFailedException.class);

        verify(spaceRepository, never()).save(any());
    }

    private void authenticateAs(UUID userId, String username) {
        AuthenticatedUser principal = new AuthenticatedUser(userId, username);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
