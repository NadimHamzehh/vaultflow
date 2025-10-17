// src/main/java/com/example/securetransfer/web/AuthController.java
package com.example.securetransfer.web;

import com.example.securetransfer.domain.Account;
import com.example.securetransfer.domain.User;
import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.UserRepository;
import com.example.securetransfer.repo.UserTwoFactorRepository;
import com.example.securetransfer.security.JwtService;
import com.example.securetransfer.security.TotpService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private static final Logger log = LoggerFactory.getLogger(AuthController.class);

  private final UserRepository users;
  private final UserTwoFactorRepository user2fa;
  private final AccountRepository accounts;
  private final PasswordEncoder encoder;
  private final JwtService jwt;
  private final TotpService totp;
  private final Random rnd = new SecureRandom();

  public AuthController(UserRepository users,
                        UserTwoFactorRepository user2fa,
                        AccountRepository accounts,
                        PasswordEncoder encoder,
                        JwtService jwt,
                        TotpService totp) {
    this.users = users;
    this.user2fa = user2fa;
    this.accounts = accounts;
    this.encoder = encoder;
    this.jwt = jwt;
    this.totp = totp;
  }

  // ===== DTOs =====
  public record LoginReq(@Email @NotBlank String email, @NotBlank String password) {}
  public record LoginResp(boolean requires2fa, String tempToken, String token) {}
  public record OtpReq(@NotBlank String code) {}
  public record RegisterReq(
      @NotBlank String username,
      @Email @NotBlank String email,
      @NotBlank String password,
      String initialDeposit
  ) {}
  public record RegisterResp(String message) {}

  // ===== LOGIN (email-based) =====
  @PostMapping("/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginReq req) {
    try {
      // Normalize input to avoid case/whitespace surprises
      final String email = Optional.ofNullable(req.email()).orElse("").trim().toLowerCase();
      final String password = Optional.ofNullable(req.password()).orElse("");

      if (email.isBlank() || password.isBlank()) {
        return ResponseEntity.status(400).body(Map.of("error", "Email and password are required"));
      }

      // Try email (case-insensitive). If you have a findByEmailIgnoreCase, prefer that.
      var uOpt = users.findByEmail(email);
      if (uOpt.isEmpty()) {
        log.info("Login failed: email not found [{}]", email);
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
      }
      var u = uOpt.get();

      if (!encoder.matches(password, u.getPassword())) {
        log.info("Login failed: bad password for [{}]", email);
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
      }

      // Strict 2FA via user_2fa table (enabled row must exist)
      var twofaOpt = user2fa.findEnabledByUserId(u.getId());
      log.info("Login ok for email='{}' username='{}' id={} 2FA={}",
          u.getEmail(), u.getUsername(), u.getId(), twofaOpt.isPresent());

      if (twofaOpt.isPresent()) {
        // Issue TEMP preAuth token (subject = username as before)
        String temp = jwt.issueTempToken(u.getUsername(), 300);
        return ResponseEntity.ok(new LoginResp(true, temp, null));
      }

      // No 2FA → issue full access token
      String rolesCsv = (u.getRoles() == null || u.getRoles().isBlank()) ? "USER" : u.getRoles();
      String token = jwt.issueAccessToken(u.getUsername(), rolesCsv, 3600);
      return ResponseEntity.ok(new LoginResp(false, null, token));

    } catch (Exception ex) {
      // Last-resort guard: never leak a stacktrace to the client
      log.error("Unexpected error during /login", ex);
      return ResponseEntity.status(500).body(Map.of("error", "Server error during login"));
    }
  }

  // ===== 2FA VERIFY (uses temp preAuth token) =====
  @PostMapping("/2fa/verify")
  public ResponseEntity<?> verify(@Valid @RequestBody OtpReq req) {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getName() == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }

    var u = users.findByUsername(auth.getName()).orElse(null);
    if (u == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }

    var twofa = user2fa.findEnabledByUserId(u.getId()).orElse(null);
    if (twofa == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "2FA not enabled"));
    }

    boolean ok = totp.verifyCode(twofa.getSecret(), req.code());
    if (!ok) {
      return ResponseEntity.status(401).body(Map.of("error", "Invalid OTP"));
    }

    String rolesCsv = (u.getRoles() == null || u.getRoles().isBlank()) ? "USER" : u.getRoles();
    String token = jwt.issueAccessToken(u.getUsername(), rolesCsv, 3600);
    return ResponseEntity.ok(Map.of("token", token));
  }

  // ===== REGISTER (email-based) =====
  @PostMapping("/register")
  public ResponseEntity<?> register(@Valid @RequestBody RegisterReq req) {
    try {
      final String email = Optional.ofNullable(req.email()).orElse("").trim().toLowerCase();
      final String username = Optional.ofNullable(req.username()).orElse("").trim();

      if (users.findByEmail(email).isPresent()) {
        return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
      }
      if (users.findByUsername(username).isPresent()) {
        return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
      }

      var u = new User();
      u.setUsername(username);
      u.setEmail(email);
      u.setPassword(encoder.encode(req.password()));
      u.setRoles("USER");
      users.save(u);

      var acc = new Account();
      acc.setUser(u);
      acc.setAccountNumber("ACCT" + (100000 + rnd.nextInt(900000)));
      var dep = (req.initialDeposit() == null || req.initialDeposit().isBlank()) ? "0.00" : req.initialDeposit();
      acc.setBalance(new BigDecimal(dep));
      accounts.save(acc);

      return ResponseEntity.ok(new RegisterResp("Registered. You can now log in."));
    } catch (Exception ex) {
      log.error("Unexpected error during /register", ex);
      return ResponseEntity.status(500).body(Map.of("error", "Server error during registration"));
    }
  }
}
