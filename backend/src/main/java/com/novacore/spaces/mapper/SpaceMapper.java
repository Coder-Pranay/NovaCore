package com.novacore.spaces.mapper;

import com.novacore.spaces.Space;
import com.novacore.spaces.dto.SpaceResponse;
import org.springframework.stereotype.Component;

@Component
public class SpaceMapper {

    public SpaceResponse toResponse(Space space) {
        SpaceResponse response = new SpaceResponse();
        response.setId(space.getId());
        response.setOwnerId(space.getOwner().getId());
        response.setName(space.getName());
        response.setSlug(space.getSlug());
        response.setDescription(space.getDescription());
        response.setIcon(space.getIcon());
        response.setColor(space.getColor());
        response.setType(space.getType());
        response.setFavorite(space.isFavorite());
        response.setArchived(space.isArchived());
        response.setDisplayOrder(space.getDisplayOrder());
        response.setCreatedAt(space.getCreatedAt());
        response.setUpdatedAt(space.getUpdatedAt());
        return response;
    }
}
