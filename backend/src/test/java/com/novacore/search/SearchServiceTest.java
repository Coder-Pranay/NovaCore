package com.novacore.search;

import com.novacore.assets.AssetRepository;
import com.novacore.assets.AssetType;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.search.dto.SearchAssetResult;
import com.novacore.search.dto.SearchResponse;
import com.novacore.search.dto.SearchSpaceResult;
import com.novacore.search.exception.InvalidSearchQueryException;
import com.novacore.search.projection.AssetSearchProjection;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.spaces.Space;
import com.novacore.spaces.SpaceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private AssetRepository assetRepository;

    private SearchService searchService;
    private UUID ownerId;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ownerId = UUID.randomUUID();
        searchService = new SearchService(List.of(
                new SpaceSearchContributor(spaceRepository),
                new AssetSearchContributor(assetRepository)));
        authenticateAs(ownerId, "searchuser");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void search_returnsMatchingSpaces() {
        Space health = space("Health", "Medical records", true);
        when(spaceRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(health)));
        when(assetRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(Page.empty());

        SearchResponse response = searchService.search("health", 0, 20);

        assertThat(response.getQuery()).isEqualTo("health");
        assertThat(response.getSpaces()).hasSize(1);
        SearchSpaceResult spaceResult = response.getSpaces().getFirst();
        assertThat(spaceResult.getName()).isEqualTo("Health");
        assertThat(spaceResult.getDescription()).isEqualTo("Medical records");
        assertThat(spaceResult.isFavorite()).isTrue();
        assertThat(response.getTotalSpaces()).isOne();
        assertThat(response.getAssets()).isEmpty();
        assertThat(response.getTotalAssets()).isZero();
    }

    @Test
    void search_returnsMatchingAssetsWithSpaceInfo() {
        AssetSearchProjection projection = assetProjection(
                "Blood Report.pdf",
                "Annual checkup",
                AssetType.PDF,
                false,
                UUID.randomUUID(),
                "Health");

        when(spaceRepository.searchByUserAndKeyword(eq(ownerId), eq("%report%"), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(assetRepository.searchByUserAndKeyword(eq(ownerId), eq("%report%"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(projection)));

        SearchResponse response = searchService.search("report", 0, 20);

        assertThat(response.getAssets()).hasSize(1);
        SearchAssetResult assetResult = response.getAssets().getFirst();
        assertThat(assetResult.getName()).isEqualTo("Blood Report.pdf");
        assertThat(assetResult.getDescription()).isEqualTo("Annual checkup");
        assertThat(assetResult.getAssetType()).isEqualTo(AssetType.PDF);
        assertThat(assetResult.getSpaceName()).isEqualTo("Health");
        assertThat(response.getTotalAssets()).isOne();
    }

    @Test
    void search_rejectsMissingQuery() {
        assertThatThrownBy(() -> searchService.search(null, 0, 20))
                .isInstanceOf(InvalidSearchQueryException.class)
                .hasMessage("Search query is required");
    }

    @Test
    void search_rejectsBlankQuery() {
        assertThatThrownBy(() -> searchService.search("   ", 0, 20))
                .isInstanceOf(InvalidSearchQueryException.class)
                .hasMessage("Search query must not be blank");
    }

    @Test
    void search_rejectsQueryExceedingMaxLength() {
        String longQuery = "a".repeat(101);

        assertThatThrownBy(() -> searchService.search(longQuery, 0, 20))
                .isInstanceOf(InvalidSearchQueryException.class)
                .hasMessage("Search query must not exceed 100 characters");
    }

    @Test
    void search_trimsQueryBeforeSearching() {
        when(spaceRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(assetRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(Page.empty());

        SearchResponse response = searchService.search("  health  ", 0, 20);

        assertThat(response.getQuery()).isEqualTo("health");
    }

    @Test
    void search_appliesPaginationAndCapsPageSize() {
        when(spaceRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(assetRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(Page.empty());

        searchService.search("health", 2, 100);

        Pageable expected = PageRequest.of(2, 50);
        verify(spaceRepository).searchByUserAndKeyword(eq(ownerId), eq("%health%"), eq(expected));
        verify(assetRepository).searchByUserAndKeyword(eq(ownerId), eq("%health%"), eq(expected));
    }

    @Test
    void search_ordersSpacesAlphabeticallyFromRepository() {
        Space alpha = space("Alpha Health", null, false);
        Space beta = space("Beta Health", null, false);

        when(spaceRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(alpha, beta)));
        when(assetRepository.searchByUserAndKeyword(eq(ownerId), eq("%health%"), any(Pageable.class)))
                .thenReturn(Page.empty());

        SearchResponse response = searchService.search("health", 0, 20);

        assertThat(response.getSpaces())
                .extracting(SearchSpaceResult::getName)
                .containsExactly("Alpha Health", "Beta Health");
    }

    @Test
    void search_requiresAuthentication() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> searchService.search("health", 0, 20))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("Unauthorized");
    }

    private Space space(String name, String description, boolean favorite) {
        Space space = new Space();
        space.setId(UUID.randomUUID());
        space.setName(name);
        space.setDescription(description);
        space.setFavorite(favorite);
        space.setCreatedAt(Instant.parse("2026-07-20T10:30:00Z"));
        return space;
    }

    private AssetSearchProjection assetProjection(
            String name,
            String description,
            AssetType assetType,
            boolean favorite,
            UUID spaceId,
            String spaceName) {
        return new AssetSearchProjection() {
            @Override
            public UUID getId() {
                return UUID.randomUUID();
            }

            @Override
            public String getName() {
                return name;
            }

            @Override
            public String getDescription() {
                return description;
            }

            @Override
            public AssetType getAssetType() {
                return assetType;
            }

            @Override
            public boolean isFavorite() {
                return favorite;
            }

            @Override
            public UUID getSpaceId() {
                return spaceId;
            }

            @Override
            public String getSpaceName() {
                return spaceName;
            }

            @Override
            public Instant getCreatedAt() {
                return Instant.parse("2026-07-21T14:00:00Z");
            }
        };
    }

    private void authenticateAs(UUID userId, String username) {
        AuthenticatedUser principal = new AuthenticatedUser(userId, username);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }
}
