package com.example.securetransfer.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name="accounts")
public class Account {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  private Long id;

  @Column(name="account_number", unique=true, nullable=false)
  private String accountNumber;

  @Column(nullable=false, precision=19, scale=2)
  private BigDecimal balance = BigDecimal.ZERO;

  @OneToOne @JoinColumn(name="user_id", nullable=false)
  private User user;

  // getters/setters
  public Long getId(){return id;}
  public void setId(Long id){this.id=id;}
  public String getAccountNumber(){return accountNumber;}
  public void setAccountNumber(String accountNumber){this.accountNumber=accountNumber;}
  public BigDecimal getBalance(){return balance;}
  public void setBalance(BigDecimal balance){this.balance=balance;}
  public User getUser(){return user;}
  public void setUser(User user){this.user=user;}
}
