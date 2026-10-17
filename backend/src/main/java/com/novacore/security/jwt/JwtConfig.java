package com.novacore.security.jwt;

import com.novacore.security.auth.AuthCookieProperties;
import com.novacore.auth.AuthProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({JwtProperties.class, AuthCookieProperties.class, AuthProperties.class})
public class JwtConfig {
}
