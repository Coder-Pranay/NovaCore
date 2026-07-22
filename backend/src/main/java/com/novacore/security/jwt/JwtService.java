package com.novacore.security.jwt;

import com.novacore.auth.exception.ExpiredTokenException;
import com.novacore.auth.exception.InvalidTokenException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    public static final String CLAIM_USER_ID = "uid";
    public static final String CLAIM_TOKEN_TYPE = "typ";

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(UUID userId, String username) {
        return buildToken(userId, username, JwtClaims.TYPE_ACCESS, jwtProperties.getAccessTokenExpiration());
    }

    public String generateRefreshToken(UUID userId, String username) {
        return buildToken(userId, username, JwtClaims.TYPE_REFRESH, jwtProperties.getRefreshTokenExpiration());
    }

    public boolean validateToken(String token) {
        parseClaims(token);
        return true;
    }

    public String extractUsername(String token) {
        return parseClaims(token).username();
    }

    public UUID extractUserId(String token) {
        return parseClaims(token).userId();
    }

    public Instant extractExpiration(String token) {
        return parseClaims(token).expiresAt();
    }

    public boolean isExpired(String token) {
        try {
            return parseClaims(token).expiresAt().isBefore(Instant.now());
        } catch (ExpiredTokenException ex) {
            return true;
        }
    }

    public JwtClaims parseClaims(String token) {
        Claims claims = parseRawClaims(token);
        return toJwtClaims(claims);
    }

    private String buildToken(
            UUID userId,
            String username,
            String tokenType,
            java.time.Duration expiration) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(expiration);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(jwtProperties.getIssuer())
                .subject(username)
                .claim(CLAIM_USER_ID, userId.toString())
                .claim(CLAIM_TOKEN_TYPE, tokenType)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
    }

    private Claims parseRawClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .requireIssuer(jwtProperties.getIssuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            throw new ExpiredTokenException("Token has expired", ex);
        } catch (MalformedJwtException
                 | UnsupportedJwtException
                 | SecurityException
                 | IllegalArgumentException ex) {
            throw new InvalidTokenException("Token is invalid", ex);
        }
    }

    private JwtClaims toJwtClaims(Claims claims) {
        String userIdValue = claims.get(CLAIM_USER_ID, String.class);
        if (userIdValue == null || userIdValue.isBlank()) {
            throw new InvalidTokenException("Token is missing user id claim");
        }

        String tokenType = claims.get(CLAIM_TOKEN_TYPE, String.class);
        if (tokenType == null || tokenType.isBlank()) {
            throw new InvalidTokenException("Token is missing type claim");
        }

        Instant issuedAt = claims.getIssuedAt() != null
                ? claims.getIssuedAt().toInstant()
                : null;
        Instant expiresAt = claims.getExpiration() != null
                ? claims.getExpiration().toInstant()
                : null;

        return new JwtClaims(
                UUID.fromString(userIdValue),
                claims.getSubject(),
                tokenType,
                issuedAt,
                expiresAt,
                claims.getIssuer());
    }
}
