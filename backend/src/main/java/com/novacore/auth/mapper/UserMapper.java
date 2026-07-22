package com.novacore.auth.mapper;

import com.novacore.auth.dto.AuthenticatedUserResponse;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.auth.dto.RegisterResponse;
import com.novacore.users.Role;
import com.novacore.users.User;
import com.novacore.users.UserStatus;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    /**
     * Maps registration input to a new {@link User}.
     * Does not set {@code passwordHash} — the service hashes the password separately.
     */
    public User toEntity(RegisterRequest request) {
        User user = new User();
        user.setEmail(normalizeEmail(request.getEmail()));
        user.setUsername(request.getUsername().trim());
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(false);
        return user;
    }

    public RegisterResponse toRegisterResponse(User user) {
        RegisterResponse response = new RegisterResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setStatus(user.getStatus());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    public AuthenticatedUserResponse toAuthenticatedUserResponse(User user) {
        AuthenticatedUserResponse response = new AuthenticatedUserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setUsername(user.getUsername());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRoles(user.getRoles().stream().map(Role::getName).sorted().toList());
        return response;
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
