package vn.grandhotel.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import vn.grandhotel.config.AppProperties;
import vn.grandhotel.dto.request.LoginRequest;
import vn.grandhotel.dto.request.RegisterRequest;
import vn.grandhotel.dto.response.ApiResponse;
import vn.grandhotel.dto.response.AuthResponse;
import vn.grandhotel.dto.response.UserSummary;
import vn.grandhotel.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final String REFRESH_COOKIE = "grand_hotel_refresh_token";
    private final AuthService authService;
    private final AppProperties properties;

    public AuthController(AuthService authService, AppProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Validated @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        AuthService.LoginResult result = authService.login(request, servletRequest);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
                .body(ApiResponse.ok("Đăng nhập thành công vào hệ thống Grand Hotel.", result.response()));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken) {
        AuthService.LoginResult result = authService.refresh(refreshToken);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
                .body(ApiResponse.ok("Đã làm mới phiên đăng nhập.", result.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, expiredRefreshCookie().toString())
                .body(ApiResponse.ok("Đã đăng xuất an toàn.", null));
    }

    @GetMapping("/me")
    public ApiResponse<UserSummary> me(Authentication authentication) {
        return ApiResponse.ok("Thông tin phiên hiện tại.", authService.currentUser(authentication.getName()));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserSummary>> register(@Validated @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.ok("Đăng ký thành công.", authService.register(request)));
    }

    private ResponseCookie refreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token).httpOnly(true).secure(properties.auth().refreshCookieSecure())
                .sameSite("Strict").path("/api/v1/auth").maxAge(properties.jwt().refreshTokenDays() * 24 * 60 * 60).build();
    }

    private ResponseCookie expiredRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE, "").httpOnly(true).secure(properties.auth().refreshCookieSecure())
                .sameSite("Strict").path("/api/v1/auth").maxAge(0).build();
    }
}
