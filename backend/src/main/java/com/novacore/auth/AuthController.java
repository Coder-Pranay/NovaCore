package com.novacore.auth;

import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.LoginResponse;
import com.novacore.auth.dto.LogoutRequest;
import com.novacore.auth.dto.RefreshTokenRequest;
import com.novacore.auth.dto.RefreshTokenResponse;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.auth.dto.RegisterResponse;
import com.novacore.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authenticationService.register(request);
        return ApiResponse.success(response, "User registered successfully");
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authenticationService.authenticate(request);
        return ApiResponse.success(response, "Login successful");
    }

    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<RefreshTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = authenticationService.refresh(request);
        return ApiResponse.success(response, "Token refreshed successfully");
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authenticationService.logout(request);
        return ApiResponse.success(null, "Logged out successfully");
    }
}
