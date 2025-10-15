package com.example.securetransfer.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity @Table(name="txns")
public class Txn {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;

  @Column(nullable=false) private String senderAccount;
  @Column(nullable=false) private String recipientAccount;
  @Column(nullable=false, precision=19, scale=2) private BigDecimal amount;
  @Column(nullable=false) private OffsetDateTime createdAt = OffsetDateTime.now();

  // getters/setters
  public Long getId(){return id;}
  public void setId(Long id){this.id=id;}
  public String getSenderAccount(){return senderAccount;}
  public void setSenderAccount(String s){this.senderAccount=s;}
  public String getRecipientAccount(){return recipientAccount;}
  public void setRecipientAccount(String r){this.recipientAccount=r;}
  public BigDecimal getAmount(){return amount;}
  public void setAmount(BigDecimal a){this.amount=a;}
  public OffsetDateTime getCreatedAt(){return createdAt;}
  public void setCreatedAt(OffsetDateTime t){this.createdAt=t;}
}
