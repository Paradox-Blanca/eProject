package vn.grandhotel.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Tên đăng nhập, email, số điện thoại hoặc CCCD không được để trống.") String identifier,
        @NotBlank(message = "Mật khẩu không được để trống.") String password) { }
