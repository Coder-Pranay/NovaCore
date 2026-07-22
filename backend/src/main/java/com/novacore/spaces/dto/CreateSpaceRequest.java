package com.novacore.spaces.dto;

import com.novacore.spaces.SpaceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateSpaceRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    @Pattern(
            regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            message = "must contain only lowercase letters, numbers, and hyphens")
    private String slug;

    @Size(max = 2000)
    private String description;

    @Size(max = 50)
    private String icon;

    @Size(max = 20)
    @Pattern(
            regexp = "^#?[0-9A-Fa-f]{3,8}$|^$",
            message = "must be a valid hex color")
    private String color;

    private SpaceType type;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public SpaceType getType() {
        return type;
    }

    public void setType(SpaceType type) {
        this.type = type;
    }
}
