package com.novacore.search;

import com.novacore.search.dto.SearchResponse;
import com.novacore.search.dto.SearchSpaceResult;
import com.novacore.spaces.Space;
import com.novacore.spaces.SpaceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class SpaceSearchContributor implements SearchContributor {

    private final SpaceRepository spaceRepository;

    public SpaceSearchContributor(SpaceRepository spaceRepository) {
        this.spaceRepository = spaceRepository;
    }

    @Override
    public void contribute(UUID ownerId, String keywordPattern, Pageable pageable, SearchResponse response) {
        Page<Space> page = spaceRepository.searchByUserAndKeyword(ownerId, keywordPattern, pageable);
        response.setSpaces(page.getContent().stream().map(this::toResult).toList());
        response.setTotalSpaces(page.getTotalElements());
    }

    private SearchSpaceResult toResult(Space space) {
        SearchSpaceResult result = new SearchSpaceResult();
        result.setId(space.getId());
        result.setName(space.getName());
        result.setDescription(space.getDescription());
        result.setFavorite(space.isFavorite());
        result.setCreatedAt(space.getCreatedAt());
        return result;
    }
}
