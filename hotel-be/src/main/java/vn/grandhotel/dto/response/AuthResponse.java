package vn.grandhotel.dto.response;

public record AuthResponse(String tokenType, String accessToken, long expiresIn, UserSummary user) { }
