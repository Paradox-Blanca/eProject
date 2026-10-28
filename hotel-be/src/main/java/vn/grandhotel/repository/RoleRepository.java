package vn.grandhotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.grandhotel.entity.Role;

public interface RoleRepository extends JpaRepository<Role, String> { }
