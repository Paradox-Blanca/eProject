package vn.grandhotel.service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import vn.grandhotel.config.AppProperties;

/** In-memory protection for local deployments. Replace with Redis/Bucket4j when scaling across instances. */
@Service
public class LoginRateLimiter {
    private record Window(Instant startedAt, int attempts) { }
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AppProperties properties;

    public LoginRateLimiter(AppProperties properties) { this.properties = properties; }

    public boolean tryConsume(String key) {
        Instant now = Instant.now();
        Window result = windows.compute(key, (ignored, current) -> {
            if (current == null || current.startedAt().plusSeconds(60).isBefore(now)) return new Window(now, 1);
            return new Window(current.startedAt(), current.attempts() + 1);
        });
        return result.attempts() <= properties.auth().rateLimitPerMinute();
    }
}
