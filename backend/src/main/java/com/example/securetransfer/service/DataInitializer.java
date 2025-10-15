package com.example.securetransfer.service;

import com.example.securetransfer.domain.Account;
import com.example.securetransfer.domain.User;
import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {
  private final UserRepository users;
  private final AccountRepository accounts;
  private final PasswordEncoder encoder;

  public DataInitializer(UserRepository u, AccountRepository a, PasswordEncoder e){
    this.users=u; this.accounts=a; this.encoder=e;
  }

  @Override
  public void run(String... args) {
    if (users.count() > 0) return;
    create("alice", "password", "ACCT1001", new BigDecimal("1000.00"), "USER");
    create("bob",   "password", "ACCT2002", new BigDecimal("500.00"),  "USER");
    create("admin", "admin123", "ACCT9999", new BigDecimal("0.00"),    "ADMIN,USER");
  }

  private void create(String username, String rawPw, String accNo, BigDecimal balance, String roles){
    var u = new User(); u.setUsername(username); u.setPassword(encoder.encode(rawPw)); u.setRoles(roles);
    users.save(u);
    var a = new Account(); a.setUser(u); a.setAccountNumber(accNo); a.setBalance(balance);
    accounts.save(a);
  }
}
