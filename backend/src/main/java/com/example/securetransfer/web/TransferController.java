package com.example.securetransfer.web;

import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.UserRepository;
import com.example.securetransfer.ratelimit.RateLimiterService;
import com.example.securetransfer.service.TransferService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TransferController {
  private final TransferService transfers;
  private final UserRepository users;
  private final AccountRepository accounts;
  private final RateLimiterService limiter;

  public TransferController(TransferService t, UserRepository u, AccountRepository a, RateLimiterService lim){
    this.transfers=t; this.users=u; this.accounts=a; this.limiter=lim;
  }

  public static class TransferRequest {
    @NotBlank public String recipientAccountNumber;
    @DecimalMin(value="0.01") public BigDecimal amount;
  }

  @PostMapping("/transfers")
  public Map<String,Object> transfer(@RequestBody TransferRequest req, Authentication auth){
    var user = users.findByUsername(auth.getName()).orElseThrow();

    if (!limiter.tryTransfer(user.getUsername()))
      throw new IllegalArgumentException("Too many transfers. Please slow down.");

    var senderAcc = accounts.findByUserId(user.getId()).orElseThrow();
    var recipientExists = accounts.findByAccountNumber(req.recipientAccountNumber).isPresent();
    if (!recipientExists) throw new IllegalArgumentException("Recipient account not found");

    transfers.transfer(senderAcc.getAccountNumber(), req.recipientAccountNumber, req.amount);
    return Map.of("status","ok");
  }
}
