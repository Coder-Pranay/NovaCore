package com.novacore.dashboard.dto;

public class DashboardResponse {

    private DashboardUserSummary user;
    private DashboardSpaceSummary spaces;
    private DashboardAssetSummary assets;
    private DashboardStorageSummary storage;
    private DashboardQuickStatistics statistics;

    public DashboardUserSummary getUser() {
        return user;
    }

    public void setUser(DashboardUserSummary user) {
        this.user = user;
    }

    public DashboardSpaceSummary getSpaces() {
        return spaces;
    }

    public void setSpaces(DashboardSpaceSummary spaces) {
        this.spaces = spaces;
    }

    public DashboardAssetSummary getAssets() {
        return assets;
    }

    public void setAssets(DashboardAssetSummary assets) {
        this.assets = assets;
    }

    public DashboardStorageSummary getStorage() {
        return storage;
    }

    public void setStorage(DashboardStorageSummary storage) {
        this.storage = storage;
    }

    public DashboardQuickStatistics getStatistics() {
        return statistics;
    }

    public void setStatistics(DashboardQuickStatistics statistics) {
        this.statistics = statistics;
    }
}
