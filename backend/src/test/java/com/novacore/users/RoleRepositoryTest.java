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
class RoleRepositoryTest {

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    void cleanDatabase() {
        roleRepository.findByName("TEST_ROLE").ifPresent(roleRepository::delete);
    }

    @Test
    void saveAndFindByName() {
        Role role = new Role();
        role.setName("TEST_ROLE");
        role.setDescription("Repository test role");

        Role saved = roleRepository.save(role);

        Optional<Role> found = roleRepository.findByName("TEST_ROLE");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
        assertThat(roleRepository.existsByName("TEST_ROLE")).isTrue();
        assertThat(roleRepository.existsByName("MISSING_ROLE")).isFalse();
    }
}
