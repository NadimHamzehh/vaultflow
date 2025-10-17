// src/main/java/com/example/securetransfer/web/MeController.java
package com.example.securetransfer.web;

import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.TxnRepository;
import com.example.securetransfer.repo.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class MeController {

  private final UserRepository users;
  private final AccountRepository accounts;
  private final TxnRepository txns;

  public MeController(UserRepository users, AccountRepository accounts, TxnRepository txns) {
    this.users = users;
    this.accounts = accounts;
    this.txns = txns;
  }

  // NOTE: /api/me/account is handled by AccountController to avoid duplicate mappings.

  @GetMapping("/transactions")
  public Object myTransactions(Authentication auth) {
    var user = users.findByUsername(auth.getName()).orElseThrow();
    var acc = accounts.findByUserId(user.getId()).orElseThrow();
    return txns.findBySenderAccountOrRecipientAccountOrderByCreatedAtDesc(
        acc.getAccountNumber(), acc.getAccountNumber());
  }
}
