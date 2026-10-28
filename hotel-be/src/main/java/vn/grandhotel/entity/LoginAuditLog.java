package vn.grandhotel.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "login_audit_logs")
public class LoginAuditLog {
    @Id @GeneratedValue private UUID id;
    @ManyToOne @JoinColumn(name = "user_id") private UserAccount user;
    @Column(name = "identifier_entered", length = 100) private String identifierEntered;
    @Column(nullable = false) private boolean success;
    @Column(name = "ip_address", length = 45) private String ipAddress;
    @Column(name = "user_agent", length = 1000) private String userAgent;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public void setUser(UserAccount user) { this.user = user; }
    public void setIdentifierEntered(String identifierEntered) { this.identifierEntered = identifierEntered; }
    public void setSuccess(boolean success) { this.success = success; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
