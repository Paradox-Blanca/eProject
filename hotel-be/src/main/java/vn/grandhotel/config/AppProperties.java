package vn.grandhotel.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Auth auth, Cors cors, boolean seedDemoData) {
    public record Jwt(String secret, long accessTokenMinutes, long refreshTokenDays) { }
    public record Auth(int maxFailedAttempts, long lockMinutes, int rateLimitPerMinute, boolean refreshCookieSecure) { }
    public record Cors(List<String> allowedOrigins) { }
}
