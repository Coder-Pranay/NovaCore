package com.novacore.search;

import com.novacore.search.dto.SearchResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Pluggable search provider for a NovaCore module (spaces, assets, notes, etc.).
 * Register new implementations as Spring beans to extend global search.
 */
public interface SearchContributor {

    void contribute(UUID ownerId, String keywordPattern, Pageable pageable, SearchResponse response);
}
