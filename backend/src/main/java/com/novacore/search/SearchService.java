package com.novacore.search;

import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.search.dto.SearchResponse;
import com.novacore.search.exception.InvalidSearchQueryException;
import com.novacore.security.service.AuthenticatedUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class SearchService {

    static final int DEFAULT_PAGE = 0;
    static final int DEFAULT_SIZE = 20;
    static final int MAX_SIZE = 50;
    static final int MAX_QUERY_LENGTH = 100;

    private final List<SearchContributor> searchContributors;

    public SearchService(List<SearchContributor> searchContributors) {
        this.searchContributors = searchContributors;
    }

    @Transactional(readOnly = true)
    public SearchResponse search(String query, int page, int size) {
        UUID ownerId = requireAuthenticatedUserId();
        String normalizedQuery = validateAndNormalizeQuery(query);
        Pageable pageable = buildPageable(page, size);
        String keywordPattern = toKeywordPattern(normalizedQuery);

        SearchResponse response = new SearchResponse();
        response.setQuery(normalizedQuery);

        for (SearchContributor contributor : searchContributors) {
            contributor.contribute(ownerId, keywordPattern, pageable, response);
        }

        return response;
    }

    static String validateAndNormalizeQuery(String query) {
        if (query == null) {
            throw new InvalidSearchQueryException("Search query is required");
        }

        String trimmed = query.trim();
        if (trimmed.isEmpty()) {
            throw new InvalidSearchQueryException("Search query must not be blank");
        }
        if (trimmed.length() > MAX_QUERY_LENGTH) {
            throw new InvalidSearchQueryException("Search query must not exceed 100 characters");
        }

        return trimmed;
    }

    static Pageable buildPageable(int page, int size) {
        int normalizedPage = Math.max(page, DEFAULT_PAGE);
        int normalizedSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        return PageRequest.of(normalizedPage, normalizedSize);
    }

    static String toKeywordPattern(String normalizedQuery) {
        return "%" + normalizedQuery.toLowerCase(Locale.ROOT) + "%";
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return authenticatedUser.userId();
    }
}
