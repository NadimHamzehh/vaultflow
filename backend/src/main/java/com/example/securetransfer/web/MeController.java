package com.example.securetransfer.web;

import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.TxnRepository;
import com.example.securetransfer.repo.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class MeController {
  private final UserRepository users;
  private final AccountRepository accounts;
  private final TxnRepository txns;

  public MeController(UserRepository u, AccountRepository a, TxnRepository t){
    this.users=u; this.accounts=a; this.txns=t;
  }

  @GetMapping("/account")
  public Map<String,Object> myAccount(Authentication auth){
    var user = users.findByUsername(auth.getName()).orElseThrow();
    var acc = accounts.findByUserId(user.getId()).orElseThrow();
    return Map.of(
      "username", user.getUsername(),
      "accountNumber", acc.getAccountNumber(),
      "balance", acc.getBalance()
    );
  }

  @GetMapping("/transactions")
  public Object myTransactions(Authentication auth){
    var user = users.findByUsername(auth.getName()).orElseThrow();
    var acc = accounts.findByUserId(user.getId()).orElseThrow();
    return txns.findBySenderAccountOrRecipientAccountOrderByCreatedAtDesc(
        acc.getAccountNumber(), acc.getAccountNumber());
  }
}
