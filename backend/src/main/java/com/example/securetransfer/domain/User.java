// src/main/java/com/example/securetransfer/domain/User.java
package com.example.securetransfer.domain;

import jakarta.persistence.*;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "users_username_idx", columnList = "username"),
        @Index(name = "users_email_uk",    columnList = "email", unique = true)
    }
)
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String username;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String password; // BCrypt

  private String roles = "USER"; // comma-separated

  @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = false)
  private Account account;

  // getters/setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }

  public String getRoles() { return roles; }
  public void setRoles(String roles) { this.roles = roles; }

  public Account getAccount() { return account; }
  public void setAccount(Account account) { this.account = account; }
}
