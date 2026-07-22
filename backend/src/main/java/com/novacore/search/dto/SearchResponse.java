package com.novacore.search.dto;

import java.util.ArrayList;
import java.util.List;

public class SearchResponse {

    private String query;
    private List<SearchSpaceResult> spaces = new ArrayList<>();
    private List<SearchAssetResult> assets = new ArrayList<>();
    private long totalSpaces;
    private long totalAssets;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public List<SearchSpaceResult> getSpaces() {
        return spaces;
    }

    public void setSpaces(List<SearchSpaceResult> spaces) {
        this.spaces = spaces;
    }

    public List<SearchAssetResult> getAssets() {
        return assets;
    }

    public void setAssets(List<SearchAssetResult> assets) {
        this.assets = assets;
    }

    public long getTotalSpaces() {
        return totalSpaces;
    }

    public void setTotalSpaces(long totalSpaces) {
        this.totalSpaces = totalSpaces;
    }

    public long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(long totalAssets) {
        this.totalAssets = totalAssets;
    }
}
