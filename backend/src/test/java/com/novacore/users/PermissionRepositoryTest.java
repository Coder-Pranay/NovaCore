package com.novacore.users;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PermissionRepositoryTest {

    @Autowired
    private PermissionRepository permissionRepository;

    @BeforeEach
    void cleanDatabase() {
        permissionRepository.deleteAll();
    }

    @Test
    void saveAndFindByName() {
        Permission permission = new Permission();
        permission.setName("spaces:read");
        permission.setDescription("Read life spaces");

        Permission saved = permissionRepository.save(permission);

        Optional<Permission> found = permissionRepository.findByName("spaces:read");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
        assertThat(permissionRepository.existsByName("spaces:read")).isTrue();
        assertThat(permissionRepository.existsByName("spaces:write")).isFalse();
    }
}
