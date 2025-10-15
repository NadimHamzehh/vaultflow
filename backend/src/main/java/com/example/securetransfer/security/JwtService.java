package com.example.securetransfer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
  private final Key key;
  private final long expMinutes;

  public JwtService(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.expMinutes}") long expMinutes) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes());
    this.expMinutes = expMinutes;
  }

  public String generate(String username, String rolesCsv) {
    Instant now = Instant.now();
    return Jwts.builder()
      .setSubject(username)
      .addClaims(Map.of("roles", rolesCsv))
      .setIssuedAt(Date.from(now))
      .setExpiration(Date.from(now.plusSeconds(expMinutes * 60)))
      .signWith(key, SignatureAlgorithm.HS256)
      .compact();
  }

  public String extractUsername(String token) {
    return Jwts.parserBuilder().setSigningKey(key).build()
      .parseClaimsJws(token).getBody().getSubject();
  }
}
