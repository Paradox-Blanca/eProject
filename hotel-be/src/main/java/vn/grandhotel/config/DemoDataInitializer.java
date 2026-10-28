package vn.grandhotel.config;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import vn.grandhotel.entity.Permission;
import vn.grandhotel.entity.Role;
import vn.grandhotel.entity.UserAccount;
import vn.grandhotel.repository.PermissionRepository;
import vn.grandhotel.repository.RoleRepository;
import vn.grandhotel.repository.UserRepository;

@Configuration
public class DemoDataInitializer {
    @Bean
    CommandLineRunner seedDemoData(AppProperties properties, PermissionRepository permissions, RoleRepository roles,
            UserRepository users, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!properties.seedDemoData() || roles.count() > 0) return;

            Map<String, Permission> all = Map.ofEntries(
                    entry("view_kpi", "Xem KPI", "Báo cáo"), entry("view_revenue", "Xem doanh thu", "Báo cáo"),
                    entry("manage_rooms", "Quản lý phòng", "Phòng nghỉ"), entry("room_checkin_checkout", "Check-in / Check-out", "Phòng nghỉ"),
                    entry("room_cleaning", "Cập nhật dọn phòng", "Phòng nghỉ"), entry("manage_bookings", "Quản lý đặt phòng", "Đặt phòng"),
                    entry("create_booking", "Tạo đặt phòng", "Đặt phòng"), entry("cancel_booking", "Hủy đặt phòng", "Đặt phòng"),
                    entry("manage_finances", "Quản lý thu ngân", "Tài chính"), entry("view_staff", "Xem nhân sự", "Nhân sự"),
                    entry("manage_staff", "Quản lý nhân sự", "Nhân sự"), entry("config_permissions", "Cấu hình quyền", "Nhân sự"),
                    entry("system_reset", "Khôi phục hệ thống", "Hệ thống"));
            permissions.saveAll(all.values());

            Role admin = role("ROLE_ADMIN", "Giám Đốc / Tổng Quản Lý", "#dc2626", all.values());
            Role manager = role("ROLE_MANAGER", "Quản Lý Lễ Tân", "#d97706", select(all, "view_kpi", "view_revenue", "manage_rooms", "room_checkin_checkout", "room_cleaning", "manage_bookings", "create_booking", "cancel_booking", "manage_finances", "view_staff"));
            Role receptionist = role("ROLE_RECEPTIONIST", "Nhân Viên Lễ Tân", "#2563eb", select(all, "view_kpi", "room_checkin_checkout", "manage_bookings", "create_booking", "manage_finances"));
            Role cashier = role("ROLE_CASHIER", "Kế Toán / Thủ Quỹ", "#7c3aed", select(all, "view_kpi", "view_revenue", "room_checkin_checkout", "manage_bookings", "manage_finances"));
            Role housekeeping = role("ROLE_HOUSEKEEPING", "Quản Lý Buồng Phòng", "#059669", select(all, "room_cleaning"));
            Role customer = role("ROLE_CUSTOMER", "Khách Hàng", "#059669", List.of());
            roles.saveAll(List.of(admin, manager, receptionist, cashier, housekeeping, customer));

            user(users, passwordEncoder, "admin", "Hoàng Minh Quân", "quan.hoang@grandhotel.vn", "0903111222", null, admin);
            user(users, passwordEncoder, "manager", "Nguyễn Thu Thảo", "thao.nguyen@grandhotel.vn", "0918333444", null, manager);
            user(users, passwordEncoder, "receptionist", "Lê Hoàng Nam", "nam.le@grandhotel.vn", "0982555666", null, receptionist);
            user(users, passwordEncoder, "cashier", "Phạm Đăng Khoa", "khoa.pham@grandhotel.vn", "0945888999", null, cashier);
            user(users, passwordEncoder, "housekeeping", "Trần Thị Lan", "lan.tran@grandhotel.vn", "0937777888", null, housekeeping);
            user(users, passwordEncoder, "khachhang", "Nguyễn Văn An", "an.nguyen@email.com", "0901234567", "079095001234", customer);
        };
    }

    private static Map.Entry<String, Permission> entry(String id, String name, String group) {
        return Map.entry(id, new Permission(id, name, group));
    }
    private static Role role(String id, String name, String color, java.util.Collection<Permission> permissionSet) {
        Role role = new Role(id, name, color, null); role.setPermissions(Set.copyOf(permissionSet)); return role;
    }
    private static List<Permission> select(Map<String, Permission> all, String... keys) {
        return java.util.Arrays.stream(keys).map(all::get).toList();
    }
    private static void user(UserRepository users, PasswordEncoder encoder, String username, String name, String email, String phone, String cccd, Role role) {
        UserAccount user = new UserAccount(); user.setUsername(username); user.setFullName(name); user.setEmail(email); user.setPhone(phone); user.setCccd(cccd);
        user.setPasswordHash(encoder.encode("123456")); user.setRoles(Set.of(role)); users.save(user);
    }
}
