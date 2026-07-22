package com.novacore;

import com.novacore.auth.RefreshTokenRepository;
import com.novacore.users.PermissionRepository;
import com.novacore.users.RoleRepository;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class NovaCoreApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    void contextLoads() {
        assertThat(applicationContext.getBean(UserRepository.class)).isSameAs(userRepository);
        assertThat(applicationContext.getBean(RoleRepository.class)).isSameAs(roleRepository);
        assertThat(applicationContext.getBean(PermissionRepository.class)).isSameAs(permissionRepository);
        assertThat(applicationContext.getBean(RefreshTokenRepository.class)).isSameAs(refreshTokenRepository);
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components.db.status").value("UP"))
                .andExpect(jsonPath("$.components.redis.status").value("UP"))
                .andExpect(jsonPath("$.components.storage.status").value("UP"));
    }

    @Test
    void authRegisterPathIsPublicButGetNotAllowed() throws Exception {
        mockMvc.perform(get("/v1/auth/register"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void protectedEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/v1/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }
}
