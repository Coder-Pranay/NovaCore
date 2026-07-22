package com.novacore.users;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanDatabase() {
        userRepository.deleteAll();
    }

    @Test
    void saveAndFindByEmail() {
        User user = newUser("alice@novacore.test", "alice");

        User saved = userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("alice@novacore.test");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
        assertThat(found.get().getUsername()).isEqualTo("alice");
    }

    @Test
    void findByUsername() {
        userRepository.save(newUser("bob@novacore.test", "bob"));

        Optional<User> found = userRepository.findByUsername("bob");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("bob@novacore.test");
    }

    @Test
    void existsByEmailAndUsername() {
        userRepository.save(newUser("carol@novacore.test", "carol"));

        assertThat(userRepository.existsByEmail("carol@novacore.test")).isTrue();
        assertThat(userRepository.existsByUsername("carol")).isTrue();
        assertThat(userRepository.existsByEmail("missing@novacore.test")).isFalse();
        assertThat(userRepository.existsByUsername("missing")).isFalse();
    }

    @Test
    void findByEmailOrUsername() {
        userRepository.save(newUser("dave@novacore.test", "dave"));

        assertThat(userRepository.findByEmailOrUsername("dave@novacore.test", "other")).isPresent();
        assertThat(userRepository.findByEmailOrUsername("other@novacore.test", "dave")).isPresent();
        assertThat(userRepository.findByEmailOrUsername("x@novacore.test", "y")).isEmpty();
    }

    @Test
    void findByStatus() {
        User active = newUser("active@novacore.test", "active_user");
        active.setStatus(UserStatus.ACTIVE);
        User locked = newUser("locked@novacore.test", "locked_user");
        locked.setStatus(UserStatus.LOCKED);
        userRepository.saveAll(List.of(active, locked));

        List<User> activeUsers = userRepository.findByStatus(UserStatus.ACTIVE);

        assertThat(activeUsers).extracting(User::getUsername).containsExactly("active_user");
    }

    private static User newUser(String email, String username) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash("$2a$10$testhashplaceholder01234567890123456789012");
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }
}
