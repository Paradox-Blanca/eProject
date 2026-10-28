package vn.grandhotel.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.grandhotel.entity.UserAccount;

public interface UserRepository extends JpaRepository<UserAccount, UUID> {
    @Query("select u from UserAccount u where lower(u.username) = lower(:identifier) or lower(u.email) = lower(:identifier) or u.phone = :identifier or u.cccd = :identifier")
    Optional<UserAccount> findByIdentifier(@Param("identifier") String identifier);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
}
