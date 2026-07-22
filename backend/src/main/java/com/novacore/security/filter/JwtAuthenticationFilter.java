package com.novacore.security.filter;

import com.novacore.security.jwt.JwtClaims;
import com.novacore.security.jwt.JwtException;
import com.novacore.security.jwt.JwtService;
import com.novacore.security.service.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authorization != null && authorization.startsWith(BEARER_PREFIX)) {
            String token = authorization.substring(BEARER_PREFIX.length()).trim();
            authenticateAccessToken(token);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateAccessToken(String token) {
        if (token.isBlank() || SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }

        try {
            JwtClaims claims = jwtService.parseClaims(token);
            if (!claims.isAccessToken()) {
                return;
            }

            AuthenticatedUser principal = new AuthenticatedUser(claims.userId(), claims.username());
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER")));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException ignored) {
            // Invalid tokens are ignored; protected endpoints will return 401.
        }
    }
}
