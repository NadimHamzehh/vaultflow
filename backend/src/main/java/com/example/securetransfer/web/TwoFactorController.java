package com.example.securetransfer.web;

import com.example.securetransfer.notifications.NotificationSeverity;
import com.example.securetransfer.notifications.NotificationService;
import com.example.securetransfer.notifications.NotificationType;
import com.example.securetransfer.repo.UserRepository;
import com.example.securetransfer.security.TotpService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/2fa")
public class TwoFactorController {

  private static final Logger log = LoggerFactory.getLogger(TwoFactorController.class);

  private final TotpService totp;
  private final UserRepository users;
  private final JdbcTemplate jdbc;
  private final NotificationService notifications;

  public TwoFactorController(TotpService totp,
                             UserRepository users,
                             JdbcTemplate jdbc,
                             NotificationService notifications) {
    this.totp = totp;
    this.users = users;
    this.jdbc = jdbc;
    this.notifications = notifications;
  }

  /** Quick status check so UI can show enable/disable state */
  @GetMapping("/status")
  public Map<String, Object> status(Authentication auth) {
    var u = users.findByUsername(auth.getName()).orElseThrow();
    var row = jdbc.queryForList("SELECT enabled FROM user_2fa WHERE user_id = ?", u.getId());
    boolean enabled = !row.isEmpty() && Optional.ofNullable((Boolean) row.get(0).get("enabled")).orElse(false);
    return Map.of("enabled", enabled);
  }

  /** Start enrollment: generate new secret + QR data URI */
  @PostMapping("/enroll")
  public Map<String, Object> enroll(Authentication auth) {
    var u = users.findByUsername(auth.getName()).orElseThrow();

    String secret = totp.generateSecret();
    String qr = totp.qrDataUri("VaultFlow", u.getUsername(), secret);

    // upsert secret (not enabled yet)
    jdbc.update("""
        INSERT INTO user_2fa(user_id, secret, enabled, created_at)
        VALUES (?, ?, false, now())
        ON CONFLICT (user_id) DO UPDATE SET secret = EXCLUDED.secret, enabled = false
      """, u.getId(), secret);

    return Map.of("secret", secret, "qrDataUri", qr);
  }

  /** Verify the code shown in authenticator & enable 2FA if valid */
  @PostMapping("/verify")
  public ResponseEntity<?> verify(Authentication auth,
                                  @RequestBody Map<String, String> body,
                                  HttpServletRequest httpReq) {
    var u = users.findByUsername(auth.getName()).orElseThrow();
    var code = Optional.ofNullable(body.getOrDefault("code","")).orElse("").trim();

    var secret = jdbc.queryForObject(
        "SELECT secret FROM user_2fa WHERE user_id = ?",
        String.class, u.getId()
    );

    if (secret == null || secret.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "No enrollment in progress"));
    }
    if (!totp.verifyCode(secret, code)) {
      return ResponseEntity.status(401).body(Map.of("message", "Invalid code"));
    }

    // Enable 2FA
    jdbc.update("UPDATE user_2fa SET enabled = true WHERE user_id = ?", u.getId());

    // Email notification (don’t fail the request if mail has issues)
    try {
      final String ip = clientIp(httpReq);
      final String device = userAgent(httpReq);
      notifications.createAndMaybeEmail(
          u.getId(),
          u.getEmail(),
          u.getUsername(),
          NotificationType.TWO_FA_TOGGLED,
          NotificationSeverity.INFO,
          "Two-Factor Authentication enabled",
          "Two-Factor Authentication has been enabled on your account.",
          Map.of("enabled", true),
          ip,
          device,
          true
      );
      log.info("2FA-enabled email enqueued for user {}", u.getId());
    } catch (Exception ex) {
      log.warn("2FA-enabled notify/email failed for user {}: {}", u.getId(), ex.toString());
    }

    return ResponseEntity.ok(Map.of("enabled", true));
  }

  /** Disable 2FA */
  @PostMapping("/disable")
  public Map<String, Object> disable(Authentication auth) {
    var u = users.findByUsername(auth.getName()).orElseThrow();
    jdbc.update("UPDATE user_2fa SET enabled = false WHERE user_id = ?", u.getId());
    return Map.of("enabled", false, "disabledAt", OffsetDateTime.now().toString());
  }

  // --- Helpers: IP / device
  private String clientIp(HttpServletRequest req) {
    var xf = req.getHeader("X-Forwarded-For");
    if (xf != null && !xf.isBlank()) return xf.split(",")[0].trim();
    var xr = req.getHeader("X-Real-IP");
    return (xr != null && !xr.isBlank()) ? xr : req.getRemoteAddr();
  }

  private String userAgent(HttpServletRequest req) {
    var ua = req.getHeader("User-Agent");
    return (ua == null || ua.isBlank()) ? "-" : ua;
  }
}
