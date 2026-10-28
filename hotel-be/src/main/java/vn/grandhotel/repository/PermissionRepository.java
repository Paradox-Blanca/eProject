package vn.grandhotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.grandhotel.entity.Permission;

public interface PermissionRepository extends JpaRepository<Permission, String> { }
