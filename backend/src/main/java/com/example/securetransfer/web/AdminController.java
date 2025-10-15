package com.example.securetransfer.web;

import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  public record AccountSummary(Long userId, String username, String accountNumber, String balance) {}
  private final UserRepository users;
  private final AccountRepository accounts;

  public AdminController(UserRepository u, AccountRepository a){ this.users=u; this.accounts=a; }

  @GetMapping("/accounts")
  public Page<AccountSummary> list(@RequestParam(defaultValue="0") int page,
                                   @RequestParam(defaultValue="10") int size) {
    var pr = PageRequest.of(page, size, Sort.by("id").ascending());
    var pageEntities = accounts.findAll(pr);
    List<AccountSummary> mapped = pageEntities.getContent().stream().map(acc ->
        new AccountSummary(acc.getUser().getId(), acc.getUser().getUsername(),
            acc.getAccountNumber(), acc.getBalance().toPlainString())
    ).toList();
    return new PageImpl<>(mapped, pr, pageEntities.getTotalElements());
  }
}
