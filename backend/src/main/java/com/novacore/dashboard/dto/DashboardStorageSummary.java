package com.novacore.dashboard.dto;

public class DashboardStorageSummary {

    private long totalFileCount;
    private long totalBytesUsed;
    private String formattedSize;

    public long getTotalFileCount() {
        return totalFileCount;
    }

    public void setTotalFileCount(long totalFileCount) {
        this.totalFileCount = totalFileCount;
    }

    public long getTotalBytesUsed() {
        return totalBytesUsed;
    }

    public void setTotalBytesUsed(long totalBytesUsed) {
        this.totalBytesUsed = totalBytesUsed;
    }

    public String getFormattedSize() {
        return formattedSize;
    }

    public void setFormattedSize(String formattedSize) {
        this.formattedSize = formattedSize;
    }
}
