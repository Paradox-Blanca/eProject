package vn.grandhotel.dto.response;

import java.util.List;

public record UserSummary(String id, String username, String fullName, String email, List<String> roles, List<String> permissions) { }
