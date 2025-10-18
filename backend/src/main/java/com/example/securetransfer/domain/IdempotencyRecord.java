package com.example.securetransfer.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
  name = "idempotency_records",
  uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "idem_key"})
)
public class IdempotencyRecord {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="user_id", nullable=false)
  private Long userId;

  @Column(name="idem_key", nullable=false, length=128)
  private String idemKey;

  @Column(name="request_hash", nullable=false, length=128)
  private String requestHash;

  @Column(name="txn_id")
  private Long txnId;

  @Column(name="created_at", nullable=false)
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public Long getUserId() { return userId; }
  public String getIdemKey() { return idemKey; }
  public String getRequestHash() { return requestHash; }
  public Long getTxnId() { return txnId; }
  public Instant getCreatedAt() { return createdAt; }

  public void setId(Long id) { this.id = id; }
  public void setUserId(Long userId) { this.userId = userId; }
  public void setIdemKey(String idemKey) { this.idemKey = idemKey; }
  public void setRequestHash(String requestHash) { this.requestHash = requestHash; }
  public void setTxnId(Long txnId) { this.txnId = txnId; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
