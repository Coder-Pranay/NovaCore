package com.novacore.users.mapper;

import com.novacore.users.Role;
import com.novacore.users.User;
import com.novacore.users.dto.UserProfileResponse;
import org.springframework.stereotype.Component;

@Component
public class UserProfileMapper {

    public UserProfileResponse toProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setProfileImageUrl(user.getProfileImageUrl());
        response.setStatus(user.getStatus());
        response.setEmailVerified(user.isEmailVerified());
        response.setRoles(user.getRoles().stream().map(Role::getName).sorted().toList());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
