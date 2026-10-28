package vn.grandhotel.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vn.grandhotel.config.AppProperties;
import vn.grandhotel.dto.response.UserSummary;

@Service
public class JwtService {
    private final AppProperties properties;
    private final SecretKey signingKey;

    public JwtService(AppProperties properties) {
        this.properties = properties;
        byte[] secret = properties.jwt().secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) throw new IllegalStateException("APP_JWT_SECRET must be at least 32 bytes.");
        this.signingKey = Keys.hmacShaKeyFor(secret);
    }

    public String generateAccessToken(UserSummary user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.id())
                .claims(Map.of("username", user.username(), "roles", user.roles(), "permissions", user.permissions()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenLifetimeSeconds())))
                .signWith(signingKey)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
    }

    public long accessTokenLifetimeSeconds() { return properties.jwt().accessTokenMinutes() * 60; }
}
