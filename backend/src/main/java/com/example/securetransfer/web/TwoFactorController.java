package com.example.securetransfer.web;

import com.example.securetransfer.repo.UserRepository;
import com.example.securetransfer.security.TotpService;
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

    private final TotpService totp;
    private final UserRepository users;
    private final JdbcTemplate jdbc;

    public TwoFactorController(TotpService totp, UserRepository users, JdbcTemplate jdbc) {
        this.totp = totp;
        this.users = users;
        this.jdbc = jdbc;
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
    public ResponseEntity<?> verify(Authentication auth, @RequestBody Map<String, String> body) {
        var u = users.findByUsername(auth.getName()).orElseThrow();
        var code = Optional.ofNullable(body.get("code")).orElse("").trim();

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

        jdbc.update("UPDATE user_2fa SET enabled = true WHERE user_id = ?", u.getId());
        return ResponseEntity.ok(Map.of("enabled", true));
    }

    /** Disable 2FA (optionally verify a code—here we accept without) */
    @PostMapping("/disable")
    public Map<String, Object> disable(Authentication auth) {
        var u = users.findByUsername(auth.getName()).orElseThrow();
        jdbc.update("UPDATE user_2fa SET enabled = false WHERE user_id = ?", u.getId());
        return Map.of("enabled", false, "disabledAt", OffsetDateTime.now().toString());
    }
}
