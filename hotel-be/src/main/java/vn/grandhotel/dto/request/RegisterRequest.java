package vn.grandhotel.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống.") @Size(min = 3, max = 50) String username,
        @NotBlank(message = "Họ tên không được để trống.") @Size(max = 100) String fullName,
        @Email(message = "Email không hợp lệ.") String email,
        @NotBlank(message = "Số điện thoại không được để trống.") @Size(max = 20) String phone,
        @NotBlank(message = "Mật khẩu không được để trống.") @Size(min = 8, max = 128, message = "Mật khẩu phải có từ 8 đến 128 ký tự.") String password) { }
