package com.novacore.dashboard.projection;

public interface StorageUsageProjection {

    long getFileCount();

    long getTotalBytes();
}
