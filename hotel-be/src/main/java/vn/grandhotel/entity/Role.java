package vn.grandhotel.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Role {
    @Id @Column(length = 50)
    private String id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "badge_color", length = 20)
    private String badgeColor;
    private String description;
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"), inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();

    public Role() { }
    public Role(String id, String name, String badgeColor, String description) {
        this.id = id; this.name = name; this.badgeColor = badgeColor; this.description = description;
    }
    public String getId() { return id; }
    public String getName() { return name; }
    public Set<Permission> getPermissions() { return permissions; }
    public void setPermissions(Set<Permission> permissions) { this.permissions = permissions; }
}
