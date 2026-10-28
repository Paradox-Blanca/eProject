package vn.grandhotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.grandhotel.entity.LoginAuditLog;

public interface LoginAuditLogRepository extends JpaRepository<LoginAuditLog, java.util.UUID> { }
