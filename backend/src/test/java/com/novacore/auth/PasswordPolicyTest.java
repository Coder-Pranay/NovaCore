package com.novacore.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyTest {

    @Test
    void validate_acceptsStrongPassword() {
        assertThatCode(() -> PasswordPolicy.validate("Secret123!")).doesNotThrowAnyException();
    }

    @Test
    void validate_rejectsWeakPasswords() {
        assertThatThrownBy(() -> PasswordPolicy.validate("short1!"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("alllowercase1!"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("ALLUPPERCASE1!"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("NoNumber!"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("NoSpecial1"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
