package com.novacore.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordServiceTest {

    private PasswordService passwordService;

    @BeforeEach
    void setUp() {
        passwordService = new PasswordService(new BCryptPasswordEncoder());
    }

    @Test
    void hashPassword_producesBcryptHash() {
        String hash = passwordService.hashPassword("Secret123!");

        assertThat(hash).isNotBlank();
        assertThat(hash).startsWith("$2");
        assertThat(hash).isNotEqualTo("Secret123!");
    }

    @Test
    void matches_returnsTrueForCorrectPassword() {
        String hash = passwordService.hashPassword("Secret123!");

        assertThat(passwordService.matches("Secret123!", hash)).isTrue();
    }

    @Test
    void matches_returnsFalseForIncorrectPassword() {
        String hash = passwordService.hashPassword("Secret123!");

        assertThat(passwordService.matches("WrongPassword", hash)).isFalse();
    }

    @Test
    void hashPassword_rejectsBlankPassword() {
        assertThatThrownBy(() -> passwordService.hashPassword(" "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
