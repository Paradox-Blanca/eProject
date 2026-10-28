package vn.grandhotel.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.grandhotel.dto.response.ApiResponse;

@RestController
@RequestMapping("/admin")
public class AdminController {
    @GetMapping("/ping")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CASHIER', 'HOUSEKEEPING')")
    public ApiResponse<Map<String, String>> ping() {
        return ApiResponse.ok("Phiên nhân sự hợp lệ.", Map.of("status", "ok"));
    }
}
