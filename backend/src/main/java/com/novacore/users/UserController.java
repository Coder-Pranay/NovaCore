package com.novacore.users;

import com.novacore.common.api.ApiResponse;
import com.novacore.users.dto.UpdateUserProfileRequest;
import com.novacore.users.dto.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getCurrentUserProfile() {
        UserProfileResponse profile = userService.getCurrentUserProfile();
        return ApiResponse.success(profile, "Profile retrieved successfully");
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileResponse> updateCurrentUserProfile(
            @Valid @RequestBody UpdateUserProfileRequest request) {
        UserProfileResponse profile = userService.updateCurrentUserProfile(request);
        return ApiResponse.success(profile, "Profile updated successfully");
    }
}
