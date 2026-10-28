package vn.grandhotel.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.grandhotel.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, java.util.UUID> {
    Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);
}
