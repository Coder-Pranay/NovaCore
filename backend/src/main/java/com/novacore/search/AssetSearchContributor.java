package com.novacore.search;

import com.novacore.search.dto.SearchAssetResult;
import com.novacore.search.dto.SearchResponse;
import com.novacore.search.projection.AssetSearchProjection;
import com.novacore.assets.AssetRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AssetSearchContributor implements SearchContributor {

    private final AssetRepository assetRepository;

    public AssetSearchContributor(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    @Override
    public void contribute(UUID ownerId, String keywordPattern, Pageable pageable, SearchResponse response) {
        Page<AssetSearchProjection> page = assetRepository.searchByUserAndKeyword(ownerId, keywordPattern, pageable);
        response.setAssets(page.getContent().stream().map(this::toResult).toList());
        response.setTotalAssets(page.getTotalElements());
    }

    private SearchAssetResult toResult(AssetSearchProjection projection) {
        SearchAssetResult result = new SearchAssetResult();
        result.setId(projection.getId());
        result.setName(projection.getName());
        result.setDescription(projection.getDescription());
        result.setAssetType(projection.getAssetType());
        result.setFavorite(projection.isFavorite());
        result.setSpaceId(projection.getSpaceId());
        result.setSpaceName(projection.getSpaceName());
        result.setCreatedAt(projection.getCreatedAt());
        return result;
    }
}
