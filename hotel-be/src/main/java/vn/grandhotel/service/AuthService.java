package vn.grandhotel.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import vn.grandhotel.config.AppProperties;
import vn.grandhotel.dto.request.LoginRequest;
import vn.grandhotel.dto.request.RegisterRequest;
import vn.grandhotel.dto.response.AuthResponse;
import vn.grandhotel.dto.response.UserSummary;
import vn.grandhotel.entity.LoginAuditLog;
import vn.grandhotel.entity.RefreshToken;
import vn.grandhotel.entity.Role;
import vn.grandhotel.entity.UserAccount;
import vn.grandhotel.exception.ApiException;
import vn.grandhotel.repository.LoginAuditLogRepository;
import vn.grandhotel.repository.RefreshTokenRepository;
import vn.grandhotel.repository.RoleRepository;
import vn.grandhotel.repository.UserRepository;
import vn.grandhotel.security.JwtService;

@Service
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository users;
    private final RoleRepository roles;
    private final RefreshTokenRepository refreshTokens;
    private final LoginAuditLogRepository auditLogs;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter rateLimiter;
    private final AppProperties properties;

    public AuthService(UserRepository users, RoleRepository roles, RefreshTokenRepository refreshTokens,
            LoginAuditLogRepository auditLogs, PasswordEncoder passwordEncoder, JwtService jwtService,
            LoginRateLimiter rateLimiter, AppProperties properties) {
        this.users = users; this.roles = roles; this.refreshTokens = refreshTokens; this.auditLogs = auditLogs;
        this.passwordEncoder = passwordEncoder; this.jwtService = jwtService; this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    @Transactional
    public LoginResult login(LoginRequest request, HttpServletRequest servletRequest) {
        String identifier = request.identifier().trim().toLowerCase();
        String rateKey = clientIp(servletRequest) + ":" + identifier;
        if (!rateLimiter.tryConsume(rateKey)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AUTH_RATE_LIMITED", "Bạn đã thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại.");
        }

        UserAccount user = users.findByIdentifier(identifier).orElse(null);
        if (user == null || !user.isActive() || user.isLocked() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            recordAudit(user, identifier, false, servletRequest);
            if (user != null && user.isActive() && !user.isLocked()) {
                user.setFailedAttempts(user.getFailedAttempts() + 1);
                if (user.getFailedAttempts() >= properties.auth().maxFailedAttempts()) {
                    user.setLockedUntil(Instant.now().plusSeconds(properties.auth().lockMinutes() * 60));
                }
                users.save(user);
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "Thông tin đăng nhập hoặc mật khẩu không chính xác.");
        }

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        users.save(user);
        recordAudit(user, identifier, true, servletRequest);
        String refreshToken = issueRefreshToken(user);
        return new LoginResult(authenticationResponse(user), refreshToken);
    }

    @Transactional
    public LoginResult refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REFRESH_MISSING", "Phiên đăng nhập đã hết hạn.");
        }
        RefreshToken refreshToken = refreshTokens.findByTokenHashAndRevokedFalse(hash(rawToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REFRESH_INVALID", "Phiên đăng nhập không hợp lệ."));
        if (refreshToken.getExpiresAt().isBefore(Instant.now()) || !refreshToken.getUser().isActive() || refreshToken.getUser().isLocked()) {
            refreshToken.setRevoked(true);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REFRESH_EXPIRED", "Phiên đăng nhập đã hết hạn.");
        }
        refreshToken.setRevoked(true);
        return new LoginResult(authenticationResponse(refreshToken.getUser()), issueRefreshToken(refreshToken.getUser()));
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            refreshTokens.findByTokenHashAndRevokedFalse(hash(rawToken)).ifPresent(token -> token.setRevoked(true));
        }
    }

    @Transactional(readOnly = true)
    public UserSummary currentUser(String userId) {
        UserAccount user = users.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_INVALID", "Phiên đăng nhập không hợp lệ."));
        return toSummary(user);
    }

    @Transactional
    public UserSummary register(RegisterRequest request) {
        String username = request.username().trim().toLowerCase();
        String email = request.email() == null ? null : request.email().trim().toLowerCase();
        String phone = request.phone().replaceAll("\\s+", "");
        if (users.existsByUsernameIgnoreCase(username) || (email != null && users.existsByEmailIgnoreCase(email)) || users.existsByPhone(phone)) {
            throw new ApiException(HttpStatus.CONFLICT, "AUTH_ACCOUNT_EXISTS", "Tên đăng nhập, email hoặc số điện thoại đã được sử dụng.");
        }
        Role customer = roles.findById("ROLE_CUSTOMER")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AUTH_ROLE_MISSING", "Vai trò khách hàng chưa được cấu hình."));
        UserAccount user = new UserAccount();
        user.setUsername(username); user.setFullName(request.fullName().trim()); user.setEmail(email); user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(request.password())); user.setRoles(Set.of(customer));
        return toSummary(users.save(user));
    }

    public AuthResponse authenticationResponse(UserAccount user) {
        UserSummary summary = toSummary(user);
        return new AuthResponse("Bearer", jwtService.generateAccessToken(summary), jwtService.accessTokenLifetimeSeconds(), summary);
    }

    public UserSummary toSummary(UserAccount user) {
        List<String> roleIds = user.getRoles().stream().map(Role::getId).sorted().toList();
        List<String> permissionIds = user.getRoles().stream().flatMap(role -> role.getPermissions().stream())
                .map(permission -> permission.getId()).distinct().sorted().toList();
        return new UserSummary(user.getId().toString(), user.getUsername(), user.getFullName(), user.getEmail(), roleIds, permissionIds);
    }

    public static Collection<SimpleGrantedAuthority> authoritiesFor(UserAccount user) {
        return user.getRoles().stream().flatMap(role -> {
            var roleAuthority = java.util.stream.Stream.of(new SimpleGrantedAuthority(role.getId()));
            var permissions = role.getPermissions().stream().map(permission -> new SimpleGrantedAuthority("PERMISSION_" + permission.getId()));
            return java.util.stream.Stream.concat(roleAuthority, permissions);
        }).collect(Collectors.toSet());
    }

    private String issueRefreshToken(UserAccount user) {
        byte[] bytes = new byte[48]; RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken token = new RefreshToken();
        token.setUser(user); token.setTokenHash(hash(rawToken));
        token.setExpiresAt(Instant.now().plusSeconds(properties.jwt().refreshTokenDays() * 24 * 60 * 60));
        refreshTokens.save(token);
        return rawToken;
    }

    private void recordAudit(UserAccount user, String identifier, boolean success, HttpServletRequest request) {
        LoginAuditLog log = new LoginAuditLog();
        log.setUser(user); log.setIdentifierEntered(identifier); log.setSuccess(success);
        log.setIpAddress(clientIp(request)); log.setUserAgent(request.getHeader("User-Agent"));
        auditLogs.save(log);
    }

    private static String hash(String value) {
        try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }

    public record LoginResult(AuthResponse response, String refreshToken) { }
}
