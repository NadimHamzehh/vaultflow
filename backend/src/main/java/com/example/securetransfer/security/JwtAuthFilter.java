package com.example.securetransfer.security;

import com.example.securetransfer.repo.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final UserRepository users;

  public JwtAuthFilter(JwtService jwtService, UserRepository users) {
    this.jwtService = jwtService;
    this.users = users;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req,
                                  HttpServletResponse res,
                                  FilterChain chain) throws ServletException, IOException {

    String header = req.getHeader(HttpHeaders.AUTHORIZATION);
    if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
      chain.doFilter(req, res);
      return;
    }

    String token = header.substring(7);
    try {
      // Parse & validate JWT
      Jws<Claims> jws = jwtService.parse(token);
      Claims claims = jws.getBody();

      final String username = claims.getSubject();
      final boolean preAuth = Boolean.TRUE.equals(claims.get("preAuth", Boolean.class));
      final String path = req.getRequestURI();

      // If this is a TEMP preAuth token, allow ONLY /api/auth/2fa/** calls.
      if (preAuth && !path.startsWith("/api/auth/2fa")) {
        SecurityContextHolder.clearContext();
        chain.doFilter(req, res);
        return;
      }

      // Authorities:
      final List<SimpleGrantedAuthority> authorities;
      if (preAuth) {
        // Must have ROLE_ prefix to work with hasRole("PRE_AUTH")
        authorities = List.of(new SimpleGrantedAuthority("ROLE_PRE_AUTH"));
      } else {
        String rolesRaw = String.valueOf(claims.getOrDefault("roles", "USER"));
        authorities = Arrays.stream(rolesRaw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
      }

      // Ensure the user still exists (avoid ghost sessions)
      if (users.findByUsername(username).isEmpty()) {
        SecurityContextHolder.clearContext();
        chain.doFilter(req, res);
        return;
      }

      AbstractAuthenticationToken authentication = new AbstractAuthenticationToken(authorities) {
        @Override public Object getCredentials() { return token; }
        @Override public Object getPrincipal() { return username; }
      };
      authentication.setAuthenticated(true);
      SecurityContextHolder.getContext().setAuthentication(authentication);

    } catch (Exception e) {
      // Invalid/expired token → clear context
      SecurityContextHolder.clearContext();
    }

    chain.doFilter(req, res);
  }
}
