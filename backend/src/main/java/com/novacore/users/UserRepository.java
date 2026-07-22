package com.novacore.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmailOrUsername(String email, String username);

    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN FETCH u.roles
            WHERE LOWER(u.email) = LOWER(:login) OR u.username = :login
            """)
    Optional<User> findByEmailOrUsernameWithRoles(@Param("login") String login);

    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN FETCH u.roles
            WHERE u.id = :id
            """)
    Optional<User> findByIdWithRoles(@Param("id") UUID id);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    List<User> findByStatus(UserStatus status);
}
