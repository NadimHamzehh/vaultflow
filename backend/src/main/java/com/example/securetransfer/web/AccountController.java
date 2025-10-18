package com.example.securetransfer.web;

import com.example.securetransfer.notifications.NotificationService;
import com.example.securetransfer.notifications.NotificationSeverity;
import com.example.securetransfer.notifications.NotificationType;
import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.UserRepository;
import com.example.securetransfer.repo.UserTwoFactorRepository;
import com.example.securetransfer.security.TotpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class AccountController {

  private static final Logger log = LoggerFactory.getLogger(AccountController.class);

  private final UserRepository users;
  private final AccountRepository accounts;
  private final UserTwoFactorRepository user2fa;
  private final TotpService totp;
  private final PasswordEncoder encoder;
  private final NotificationService notifications;

  public AccountController(UserRepository users,
                           AccountRepository accounts,
                           UserTwoFactorRepository user2fa,
                           TotpService totp,
                           PasswordEncoder encoder,
                           NotificationService notifications) {
    this.users = users;
    this.accounts = accounts;
    this.user2fa = user2fa;
    this.totp = totp;
    this.encoder = encoder;
    this.notifications = notifications;
  }

  // ---- Profile / Account ----
  @GetMapping("/account")
  public Map<String, Object> account(Authentication auth) {
    var user = users.findByUsername(auth.getName()).orElseThrow();
    var acc  = accounts.findByUserId(user.getId()).orElseThrow();
    return Map.of(
        "username",      user.getUsername(),
        "email",         user.getEmail(),
        "accountNumber", acc.getAccountNumber(),
        "balance",       acc.getBalance()
    );
  }

  // ---- Security (2FA-gated) ----
  public record RevealReq(String code) {}
  public record ChangeReq(String currentPassword, String newPassword, String confirmNewPassword, String code) {}

  @PostMapping("/security/password/reveal")
  public ResponseEntity<?> reveal(@RequestBody RevealReq req, Authentication auth) {
    var user = users.findByUsername(auth.getName()).orElseThrow();
    var twofa = user2fa.findEnabledByUserId(user.getId()).orElse(null);
    if (twofa == null) return ResponseEntity.badRequest().body(Map.of("error","2FA not enabled"));
    if (req == null || req.code() == null || !req.code().matches("\\d{6}"))
      return ResponseEntity.badRequest().body(Map.of("error","Invalid code format"));

    if (!totp.verifyCode(twofa.getSecret(), req.code()))
      return ResponseEntity.status(401).body(Map.of("error","Invalid OTP"));

    // Success; UI is allowed to “reveal” (we never return the actual password).
    return ResponseEntity.ok(Map.of("message","2FA verified"));
  }

  @PostMapping("/security/password/change")
  public ResponseEntity<?> change(@RequestBody ChangeReq req, Authentication auth) {
    var user = users.findByUsername(auth.getName()).orElseThrow();

    // 2FA checks
    var twofa = user2fa.findEnabledByUserId(user.getId()).orElse(null);
    if (twofa == null) return ResponseEntity.badRequest().body(Map.of("error","2FA not enabled"));
    if (req == null || req.code() == null || !req.code().matches("\\d{6}"))
      return ResponseEntity.badRequest().body(Map.of("error","Invalid code format"));
    if (!totp.verifyCode(twofa.getSecret(), req.code()))
      return ResponseEntity.status(401).body(Map.of("error","Invalid OTP"));

    // Password validations
    if (req.currentPassword() == null || req.newPassword() == null || req.confirmNewPassword() == null)
      return ResponseEntity.badRequest().body(Map.of("error","Missing fields"));
    if (!encoder.matches(req.currentPassword(), user.getPassword()))
      return ResponseEntity.status(401).body(Map.of("error","Current password is incorrect"));
    if (!req.newPassword().equals(req.confirmNewPassword()))
      return ResponseEntity.badRequest().body(Map.of("error","Passwords do not match"));
    if (req.newPassword().length() < 6)
      return ResponseEntity.badRequest().body(Map.of("error","Password must be at least 6 characters"));

    // Persist new password
    user.setPassword(encoder.encode(req.newPassword()));
    users.save(user);

    // Fire-and-forget email + notification record (never block the success)
    try {
      notifications.createAndMaybeEmail(
          user.getId(),
          user.getEmail(),
          user.getUsername(),
          NotificationType.PASSWORD_CHANGED,
          NotificationSeverity.WARNING,
          "Password changed",
          "Your account password was recently changed.",
          Map.of(), // meta
          null,     // ip
          null,     // device
          true      // send email
      );
      log.info("Password-change email enqueued for user {}", user.getId());
    } catch (Exception ex) {
      log.warn("Password-change notify/email failed for user {}: {}", user.getId(), ex.toString());
    }

    return ResponseEntity.ok(Map.of("message","Password updated"));
  }
}
