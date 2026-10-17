package com.novacore.auth;

import com.novacore.auth.exception.RateLimitException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-process cooldown tracker for sensitive auth emails (resend verification).
 * Suitable for single-instance deployments; pair with edge rate limiting in multi-instance prod.
 */
@Service
public class AuthCooldownService {

    private final Map<String, Instant> lastRequestByKey = new ConcurrentHashMap<>();

    public void enforceCooldown(String key, Duration cooldown) {
        Instant now = Instant.now();
        Instant previous = lastRequestByKey.get(key);
        if (previous != null) {
            Instant allowedAt = previous.plus(cooldown);
            if (now.isBefore(allowedAt)) {
                long seconds = Math.max(1, Duration.between(now, allowedAt).getSeconds());
                throw new RateLimitException(
                        "Please wait " + seconds + " seconds before requesting another email");
            }
        }
        lastRequestByKey.put(key, now);
    }

    public void clear(String key) {
        lastRequestByKey.remove(key);
    }
}
