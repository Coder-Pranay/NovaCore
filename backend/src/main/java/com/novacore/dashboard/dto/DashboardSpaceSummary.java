package com.novacore.dashboard.dto;

public class DashboardSpaceSummary {

    private long totalSpaces;
    private long favoriteSpaces;

    public long getTotalSpaces() {
        return totalSpaces;
    }

    public void setTotalSpaces(long totalSpaces) {
        this.totalSpaces = totalSpaces;
    }

    public long getFavoriteSpaces() {
        return favoriteSpaces;
    }

    public void setFavoriteSpaces(long favoriteSpaces) {
        this.favoriteSpaces = favoriteSpaces;
    }
}
