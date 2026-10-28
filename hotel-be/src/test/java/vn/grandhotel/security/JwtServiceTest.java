package vn.grandhotel.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

import vn.grandhotel.config.AppProperties;
import vn.grandhotel.dto.response.UserSummary;

class JwtServiceTest {
    @Test
    void signsAndParsesAnAccessToken() {
        AppProperties properties = new AppProperties(
                new AppProperties.Jwt("a-development-secret-with-at-least-thirty-two-characters", 15, 7),
                new AppProperties.Auth(5, 15, 5, false),
                new AppProperties.Cors(List.of("http://localhost:5173")), true);
        JwtService service = new JwtService(properties);
        UserSummary user = new UserSummary("c1f7a0b3-8d6b-4e12-b2f7-6b45e2a39d01", "admin", "Hoàng Minh Quân",
                "quan.hoang@grandhotel.vn", List.of("ROLE_ADMIN"), List.of("manage_rooms"));

        var claims = service.parse(service.generateAccessToken(user));

        assertEquals(user.id(), claims.getSubject());
        assertEquals("admin", claims.get("username"));
    }
}
