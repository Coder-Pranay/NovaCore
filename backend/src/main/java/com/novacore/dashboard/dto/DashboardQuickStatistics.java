package com.novacore.dashboard.dto;

public class DashboardQuickStatistics {

    private long images;
    private long documents;
    private long videos;
    private long notes;
    private long links;

    public long getImages() {
        return images;
    }

    public void setImages(long images) {
        this.images = images;
    }

    public long getDocuments() {
        return documents;
    }

    public void setDocuments(long documents) {
        this.documents = documents;
    }

    public long getVideos() {
        return videos;
    }

    public void setVideos(long videos) {
        this.videos = videos;
    }

    public long getNotes() {
        return notes;
    }

    public void setNotes(long notes) {
        this.notes = notes;
    }

    public long getLinks() {
        return links;
    }

    public void setLinks(long links) {
        this.links = links;
    }
}
