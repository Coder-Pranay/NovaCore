package com.novacore.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "novacore.image-gen")
public class ImageGenProperties {

    /**
     * Base URL of the Python Moss LoRA worker, e.g. http://127.0.0.1:8090
     */
    private String url = "http://127.0.0.1:8090";

    private int connectTimeoutMs = 10_000;

    private int readTimeoutMs = 2_700_000;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }
}
