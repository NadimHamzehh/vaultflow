package com.example.securetransfer.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_2fa")
public class UserTwoFactor {

  @Id
  @Column(name = "user_id")
  private Long userId;

  @Column(name = "secret", length = 64, nullable = false)
  private String secret;

  @Column(name = "enabled", nullable = false)
  private boolean enabled = false;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public UserTwoFactor() {}

  public UserTwoFactor(Long userId, String secret, boolean enabled) {
    this.userId = userId;
    this.secret = secret;
    this.enabled = enabled;
    this.createdAt = Instant.now();
  }

  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }

  public String getSecret() { return secret; }
  public void setSecret(String secret) { this.secret = secret; }

  public boolean isEnabled() { return enabled; }
  public void setEnabled(boolean enabled) { this.enabled = enabled; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
