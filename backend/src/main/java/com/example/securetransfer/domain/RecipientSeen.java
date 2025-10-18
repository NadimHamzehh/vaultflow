package com.example.securetransfer.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
  name = "recipients_seen",
  uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "recipient_account"})
)
public class RecipientSeen {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "recipient_account", nullable = false, length = 64)
  private String recipientAccount;

  @Column(name = "first_seen_at", nullable = false)
  private Instant firstSeenAt = Instant.now();

  public RecipientSeen() {}
  public RecipientSeen(Long userId, String recipientAccount) {
    this.userId = userId;
    this.recipientAccount = recipientAccount;
    this.firstSeenAt = Instant.now();
  }

  public Long getId() { return id; }
  public Long getUserId() { return userId; }
  public String getRecipientAccount() { return recipientAccount; }
  public Instant getFirstSeenAt() { return firstSeenAt; }

  public void setId(Long id) { this.id = id; }
  public void setUserId(Long userId) { this.userId = userId; }
  public void setRecipientAccount(String recipientAccount) { this.recipientAccount = recipientAccount; }
  public void setFirstSeenAt(Instant firstSeenAt) { this.firstSeenAt = firstSeenAt; }
}
