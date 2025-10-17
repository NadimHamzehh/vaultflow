package com.example.securetransfer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

  private final Key key;
  private final long expMinutes;        // default access-token TTL (minutes)
  private final long tempExpSeconds;    // short TTL for temp 2FA tokens (seconds)

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expMinutes}") long expMinutes,
      @Value("${app.jwt.tempExpSeconds:300}") long tempExpSeconds // default 5 minutes
  ) {
    this.key = deriveSigningKey(secret);
    this.expMinutes = expMinutes;
    this.tempExpSeconds = tempExpSeconds;
  }

  /** Legacy helper: issues a FULL access token (roles included). */
  public String generate(String username, String rolesCsv) {
    return issueAccessToken(username, rolesCsv, expMinutes * 60);
  }

  /** Issue a FULL access token usable across /api (ADMIN still needed for admin routes). */
  public String issueAccessToken(String username, String rolesCsv, long ttlSeconds) {
    Instant now = Instant.now();
    String roles = (rolesCsv == null || rolesCsv.isBlank()) ? "USER" : rolesCsv;
    return Jwts.builder()
        .setSubject(username)
        .claim("roles", roles)
        .claim("preAuth", false)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(now.plusSeconds(ttlSeconds)))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  /** Issue a TEMP token for the 2FA step only (has claim preAuth=true, no roles). */
  public String issueTempToken(String username) {
    return issueTempToken(username, tempExpSeconds);
  }

  /** Issue a TEMP token with custom TTL (seconds). */
  public String issueTempToken(String username, long ttlSeconds) {
    Instant now = Instant.now();
    return Jwts.builder()
        .setSubject(username)
        .claim("preAuth", true)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(now.plusSeconds(ttlSeconds)))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  /** Parse + validate a token and return the JWS with Claims. Throws if invalid/expired. */
  public Jws<Claims> parse(String token) {
    return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
  }

  public String extractUsername(String token) {
    return parse(token).getBody().getSubject();
  }

  public boolean isPreAuth(String token) {
    Object v = parse(token).getBody().get("preAuth");
    return v instanceof Boolean b && b;
  }

  public String extractRolesCsv(String token) {
    Object v = parse(token).getBody().get("roles");
    return v == null ? "USER" : String.valueOf(v);
  }

  /** Derive a safe HMAC key from secret (supports Base64 or raw text; ensures >=32 bytes for HS256). */
  private static Key deriveSigningKey(String secret) {
    byte[] keyBytes;
    try {
      keyBytes = Decoders.BASE64.decode(secret);
    } catch (Exception ignored) {
      byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
      if (raw.length < 32) {
        byte[] padded = new byte[32];
        for (int i = 0; i < 32; i++) padded[i] = raw[i % raw.length];
        keyBytes = padded;
      } else {
        keyBytes = raw;
      }
    }
    return Keys.hmacShaKeyFor(keyBytes);
  }
}
