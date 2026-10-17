package com.novacore.sharing.dto;

import jakarta.validation.constraints.Size;

public class AccessPublicLinkRequest {

    @Size(max = 100)
    private String password;

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
