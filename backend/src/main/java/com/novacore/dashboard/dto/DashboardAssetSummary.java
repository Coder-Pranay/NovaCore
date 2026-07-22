package com.novacore.dashboard.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardAssetSummary {

    private long totalAssets;
    private List<DashboardRecentUpload> recentUploads = new ArrayList<>();

    public long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(long totalAssets) {
        this.totalAssets = totalAssets;
    }

    public List<DashboardRecentUpload> getRecentUploads() {
        return recentUploads;
    }

    public void setRecentUploads(List<DashboardRecentUpload> recentUploads) {
        this.recentUploads = recentUploads;
    }
}
