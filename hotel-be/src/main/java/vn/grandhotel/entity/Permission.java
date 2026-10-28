package vn.grandhotel.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "permissions")
public class Permission {
    @Id @Column(length = 50)
    private String id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    public Permission() { }
    public Permission(String id, String name, String groupName) { this.id = id; this.name = name; this.groupName = groupName; }
    public String getId() { return id; }
}
